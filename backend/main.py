from dotenv import load_dotenv
load_dotenv()
import os
import logging
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd
import numpy as np
import json
import traceback
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- DATABASE SETUP ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

class PredictionLog(Base):
    __tablename__ = "prediction_logs"
    id = Column(Integer, primary_key=True, index=True)
    input_data = Column(String, nullable=False)
    prediction = Column(Integer, nullable=False)
    probability = Column(Float, nullable=False)
    fraud_likely = Column(Boolean, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.now)
    
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Fraud Detection API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For now, during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. LOAD MODEL, PREPROCESSOR & FEATURE COLUMNS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logger.info("Loading model and preprocessor...")
model = joblib.load(os.path.join(BASE_DIR, "models", "fraud_detection.pkl"))
preprocessor = joblib.load(os.path.join(BASE_DIR, "models", "preprocessor.pkl"))

with open(os.path.join(BASE_DIR, "models", "feature_columns.json"), "r") as f:
    feature_columns = json.load(f)

logger.info(f"Model loaded! Features: {len(feature_columns)}")
logger.info("Preprocessor loaded!")

# Extract num/cat features from preprocessor (assuming order: num first, cat second)
num_features = preprocessor.transformers_[0][2]
cat_features = preprocessor.transformers_[1][2]

# 2. DEFINE INPUT MODEL
class SimpleTransaction(BaseModel):
    TransactionAmt: float
    card1: Optional[float] = 0.0
    card2: Optional[float] = 0.0
    card3: Optional[float] = 0.0
    card4: Optional[str] = ""
    card5: Optional[float] = 0.0
    addr1: Optional[float] = 0.0
    addr2: Optional[float] = 0.0

    def to_full_transaction(self):
        """Fill all features with correct defaults, update with provided values"""
        full_data = {col: (0.0 if col in num_features else "") for col in feature_columns}
        full_data.update(self.model_dump(exclude_none=True))
        return full_data

# 3. PREDICT ENDPOINT
@app.post("/predict")
async def predict(data: SimpleTransaction, db: Session = Depends(get_db)):
    try:
        # Create full feature vector
        full_data = data.to_full_transaction()
        df_raw = pd.DataFrame([full_data])
        
        logger.info(f"Raw input shape: {df_raw.shape}")
        
        # Coerce types to match training
        for col in df_raw.columns:
            if col in num_features:
                df_raw[col] = df_raw[col].astype(float).fillna(0.0)
            elif col in cat_features:
                df_raw[col] = df_raw[col].astype(str).fillna("")

        # Apply preprocessing
        df_processed = preprocessor.transform(df_raw)
        
        logger.info(f"Preprocessed shape: {df_processed.shape}")
        
        # Make prediction (unified with threshold)
        FRAUD_THRESHOLD = 0.3  # 0.3
        probability = model.predict_proba(df_processed)[0][1]
        prediction = int(probability > FRAUD_THRESHOLD)
        is_fraud = bool(prediction)
        
        # Log to database with error handling
        db_log = PredictionLog(
            input_data=json.dumps(data.model_dump()),
            prediction=prediction,
            probability=float(probability),
            fraud_likely=is_fraud
        )
        try:
            db.add(db_log)
            db.commit()
            db.refresh(db_log)
        except Exception as db_e:
            db.rollback()
            logger.error(f"DB error: {db_e}")
            raise db_e
        
        return {
            "prediction": prediction,
            "probability": round(float(probability), 4),
            "fraud_likely": is_fraud,
            "threshold": FRAUD_THRESHOLD,
            "log_id": db_log.id,
            "message": "Prediction completed successfully"
        }
        
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error:\n{error_details}")
        return {
            "error": str(e),
            "details": error_details
        }


# --- ADD THIS NEW ENDPOINT ---
@app.get("/logs")
async def get_logs(db: Session = Depends(get_db)):
    try:
        # Query the database, get all logs, order by newest first
        logs = db.query(PredictionLog).order_by(PredictionLog.id.desc()).all()
        return logs
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Error fetching logs:\n{error_details}")
        return {"error": str(e)}
# --- END OF NEW ENDPOINT ---

@app.get("/")
async def root():
    return {
        "message": "Fraud Detection API",
        "status": "operational",
        "model_features": len(feature_columns)
    }


