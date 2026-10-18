from Model.car_price_model import train_model

if __name__ == "__main__":
    model = train_model()
    print("Model trained and saved successfully.")
    print(model)
