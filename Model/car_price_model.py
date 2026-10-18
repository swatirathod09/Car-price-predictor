from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATHS = [
    PROJECT_ROOT / "Model" / "car_price_model.joblib",
    PROJECT_ROOT / "models" / "car_price_model.joblib",
]

FEATURE_COLUMNS = [
    "brand",
    "model",
    "year",
    "km_driven",
    "fuel_type",
    "transmission",
    "engine_cc",
    "owner_type",
    "condition",
]


def build_model() -> Pipeline:
    numeric_features = ["year", "km_driven", "engine_cc"]
    categorical_features = [
        "brand",
        "model",
        "fuel_type",
        "transmission",
        "owner_type",
        "condition",
    ]

    numeric_transformer = Pipeline(
        steps=[("imputer", SimpleImputer(strategy="median"))]
    )
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_transformer, numeric_features),
            ("categorical", categorical_transformer, categorical_features),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocess", preprocessor),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=300,
                    min_samples_leaf=2,
                    max_depth=18,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def generate_training_data(n_samples: int = 1500) -> pd.DataFrame:
    rng = np.random.default_rng(42)

    brands = {
        "Toyota": ["Corolla", "Fortuner", "Innova", "Altis"],
        "Hyundai": ["Creta", "i20", "Verna", "Venue"],
        "Honda": ["City", "Amaze", "Jazz", "Civic"],
        "Maruti": ["Swift", "Baleno", "Dzire", "Brezza"],
        "Mahindra": ["XUV500", "Scorpio", "Thar", "Bolero"],
        "Tata": ["Nexon", "Harrier", "Tiago", "Safari"],
    }
    fuel_types = ["Petrol", "Diesel", "CNG"]
    transmissions = ["Manual", "Automatic"]
    owner_types = ["First", "Second", "Third"]
    conditions = ["Poor", "Average", "Good", "Excellent"]

    rows = []
    for _ in range(n_samples):
        brand = rng.choice(list(brands.keys()))
        model = rng.choice(brands[brand])
        year = int(rng.integers(2010, 2025))
        km_driven = int(rng.integers(500, 180000))
        fuel_type = rng.choice(fuel_types)
        transmission = rng.choice(transmissions)
        engine_cc = int(rng.integers(800, 2200))
        owner_type = rng.choice(owner_types)
        condition = rng.choice(conditions)

        age = 2025 - year
        brand_factor = {"Toyota": 1.12, "Hyundai": 1.08, "Honda": 1.14, "Maruti": 1.03, "Mahindra": 1.05, "Tata": 1.0}[brand]
        fuel_factor = {"Petrol": 1.0, "Diesel": 1.12, "CNG": 0.82}[fuel_type]
        transmission_factor = 1.08 if transmission == "Automatic" else 1.0
        owner_factor = {"First": 1.18, "Second": 0.95, "Third": 0.78}[owner_type]
        condition_factor = {"Poor": 0.72, "Average": 0.9, "Good": 1.0, "Excellent": 1.15}[condition]
        depreciation = 1.0 - (age * 0.025) - (km_driven / 2_000_000)
        price = 850000 * brand_factor * fuel_factor * transmission_factor * owner_factor * condition_factor * max(depreciation, 0.35)
        price += 250 * engine_cc
        price *= 1 + (0.06 if model in ["Corolla", "City", "Creta", "Swift"] else 0.0)
        price = float(np.clip(price, 15000, 5000000) + rng.normal(0, 70000))

        rows.append(
            {
                "brand": brand,
                "model": model,
                "year": year,
                "km_driven": km_driven,
                "fuel_type": fuel_type,
                "transmission": transmission,
                "engine_cc": engine_cc,
                "owner_type": owner_type,
                "condition": condition,
                "price": round(price, 2),
            }
        )

    return pd.DataFrame(rows, columns=FEATURE_COLUMNS + ["price"])


def train_model() -> Pipeline:
    df = generate_training_data()
    X = df[FEATURE_COLUMNS]
    y = df["price"]

    model = build_model()
    model.fit(X, y)

    for path in MODEL_PATHS:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, path)

    return model


def load_model() -> Pipeline:
    for path in MODEL_PATHS:
        if path.exists() and path.stat().st_size > 0:
            return joblib.load(path)
    return train_model()


if __name__ == "__main__":
    model = train_model()
    sample = pd.DataFrame(
        [
            {
                "brand": "Honda",
                "model": "City",
                "year": 2020,
                "km_driven": 28000,
                "fuel_type": "Petrol",
                "transmission": "Manual",
                "engine_cc": 1498,
                "owner_type": "First",
                "condition": "Good",
            }
        ]
    )
    print(f"Estimated price: ₹{model.predict(sample)[0]:,.0f}")