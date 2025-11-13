# Credit Card Fraud Detection

A full-stack fraud detection system with machine learning, FastAPI, PostgreSQL, React, and cloud deployment.

**🔗 Live Demo:** [Fraud Detection Dashboard](https://fraud-detection-dashboard-dxf1.onrender.com/)

**🔗 API:** [fraud-api-h8ty.onrender.com](http://fraud-api-h8ty.onrender.com)

---

##  Overview

Machine learning model that detects fraudulent credit card transactions with **96.8% AUC-ROC accuracy**.

**Tech Stack:** XGBoost · FastAPI · PostgreSQL · React · Docker · Render


##  Model Performance

| Metric | Score |
| --- | --- |
| AUC-ROC | 0.968 |
| Recall | 0.786 |
| Precision | 0.645 |
| F1-Score | 0.709 |



##  Quick Start

### Backend

```bash
git clone <your-repo>
cd backend
pip install -r requirements.txt
export DATABASE_URL="your_postgres_url"
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Docker

```bash
docker build -t fraud-api .
docker run -p 8000:8000 fraud-api
```

---

##  Key Features

- Real-time fraud predictions via REST API
- Interactive dashboard with prediction history
- PostgreSQL logging for all predictions
- Dockerized for easy deployment
- Handles class imbalance with `scale_pos_weight`
