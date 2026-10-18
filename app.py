from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request

from Model.car_price_model import FEATURE_COLUMNS, load_model

app = Flask(__name__, static_folder="static", static_url_path="")
model = load_model()

OWNER_MAP = {
    "first": "First",
    "first owner": "First",
    "second": "Second",
    "second owner": "Second",
    "third": "Third",
    "third owner": "Third",
}
FUEL_MAP = {"petrol": "Petrol", "diesel": "Diesel", "cng": "CNG"}
TRANSMISSION_MAP = {"manual": "Manual", "automatic": "Automatic"}
CONDITION_MAP = {
    "poor": "Poor",
    "average": "Average",
    "good": "Good",
    "excellent": "Excellent",
}


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"error": "Request body is empty."}), 400

    try:
        row = {
            "brand": str(payload["brand"]).strip(),
            "model": str(payload["model"]).strip(),
            "year": int(payload["year"]),
            "km_driven": float(payload.get("km", 50000)),
            "fuel_type": FUEL_MAP.get(str(payload.get("fuel", "Petrol")).strip().lower(), str(payload.get("fuel", "Petrol")).strip()),
            "transmission": TRANSMISSION_MAP.get(str(payload.get("trans", "Manual")).strip().lower(), str(payload.get("trans", "Manual")).strip()),
            "engine_cc": int(payload.get("engine", 1500)),
            "owner_type": OWNER_MAP.get(str(payload.get("owner", "First")).strip().lower(), str(payload.get("owner", "First")).strip()),
            "condition": CONDITION_MAP.get(str(payload.get("cond", "Good")).strip().lower(), str(payload.get("cond", "Good")).strip()),
        }
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Invalid request payload. Required fields: brand, model, year, km, fuel, trans, engine, owner, cond."}), 400

    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
    price = float(model.predict(df)[0])
    return jsonify({"price": round(price, 2)})


if __name__ == "__main__":
    app.run(debug=True)