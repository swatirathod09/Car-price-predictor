import pandas as pd

from Model.car_price_model import load_model

model = load_model()

sample = pd.DataFrame(
    [{
        "brand": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "km_driven": 35000,
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "engine_cc": 1498,
        "owner_type": "First",
        "condition": "Good",
    }]
)
print(f"Estimated price: INR {model.predict(sample)[0]:,.0f}")