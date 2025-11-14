import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.metrics import roc_auc_score
import joblib


X_train = pd.read_csv("X_train_processed.csv")
y_train = pd.read_csv("y_train.csv").values.ravel()

# 💡 Optional: sample a subset to reduce RAM load
X_sample, _, y_sample, _ = train_test_split(
    X_train, y_train, train_size=0.2, stratify=y_train, random_state=42
)
print(f"Using sample of shape: {X_sample.shape}")


xgb_model = XGBClassifier(
    objective="binary:logistic",
    eval_metric="auc",
    tree_method="hist",       #  much faster & less RAM
    use_label_encoder=False,
    n_jobs=-1,
    random_state=42
)


param_dist = {
    "n_estimators": [100, 200, 300],
    "max_depth": [3, 5, 7],
    "learning_rate": [0.01, 0.05, 0.1],
    "subsample": [0.6, 0.8, 1.0],
    "colsample_bytree": [0.6, 0.8, 1.0],
    "gamma": [0, 0.2, 0.5],
}


search = RandomizedSearchCV(
    estimator=xgb_model,
    param_distributions=param_dist,
    n_iter=10,                # only test 10 random combos
    scoring="roc_auc",
    cv=3,
    verbose=2,
    n_jobs=-1,
    random_state=42
)


search.fit(X_sample, y_sample)
print("\nBest Parameters:")
print(search.best_params_)


best_model = search.best_estimator_
best_model.fit(X_train, y_train)


joblib.dump(best_model, "fraud_detection.pkl")
