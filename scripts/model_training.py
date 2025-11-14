
import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, roc_auc_score
import warnings
warnings.filterwarnings("ignore")

#loading data
X_train = pd.read_csv("X_train_processed.csv")
X_test = pd.read_csv("X_test_processed.csv")
y_train = pd.read_csv("y_train.csv").squeeze()
y_test = pd.read_csv("y_test.csv").squeeze()

print("Data loaded successfully!")
print(f"Train shape: {X_train.shape}, Test shape: {X_test.shape}")

#defining model
xgb_model = XGBClassifier(
    n_estimators=300,
    learning_rate=0.1,
    max_depth=8,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=15,   # handle class imbalance
    random_state=42,
    tree_method='hist',    # faster and memory-efficient
    n_jobs=-1
)

#training
print("\n Training XGBoost model...")
xgb_model.fit(X_train, y_train)

#evaluate model
y_pred = xgb_model.predict(X_test)
y_pred_prob = xgb_model.predict_proba(X_test)[:, 1]

auc = roc_auc_score(y_test, y_pred_prob)
report = classification_report(y_test, y_pred, digits=4)

print("\n XGBoost Model Trained Successfully!")
print(f"AUC-ROC: {auc:.4f}")
print("\nClassification Report:\n", report)

