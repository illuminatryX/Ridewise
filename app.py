from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import json
from datetime import datetime
import os

app = FastAPI()

# Input model for coordinates
class Coords(BaseModel):
    lat: float
    lng: float

# Input model for request body
class InputData(BaseModel):
    place_name: str
    destination_name: str
    pickup_coords: Coords
    drop_coords: Coords

@app.post("/get_fare_data")
def get_fare_data(input_data: InputData):
    # Mock Uber fleet and prices (normally scraped)
    uber_fleet = [
        "Uber Go", "Moto", "Premier", "UberXL", "Moto Saver",
        "Auto", "Go Sedan", "Courier", "Green", "XL+ (Innova)", "Uber Pet"
    ]
    uber_prices = [
        "₹153.96", "₹140.55", "₹272.35", "₹240.26", "₹119.52",
        "₹240.45", "₹157.34", "₹83.06", "₹240.72", "Select Time", "₹282.03"
    ]
    uber_data = [
        {"fleet": name, "price": price}
        for name, price in zip(uber_fleet, uber_prices)
    ]

    # Mock Rapido fleet and prices (normally scraped)
    rapido_fleets = ["Bike", "Auto", "Cab Non AC", "Cab Premium"]
    rapido_prices = ["₹ 134 - ₹ 163", "₹ 228 - ₹ 279", "₹ 172 - ₹ 211", "₹ 218 - ₹ 267"]
    rapido_data = [
        {"fleet": fleet, "price_range": price.strip()}
        for fleet, price in zip(rapido_fleets, rapido_prices)
    ]

    # Final output structure
    output = {
        "place_name": input_data.place_name,
        "destination_name": input_data.destination_name,
        "pickup_coords": [input_data.pickup_coords.lat, input_data.pickup_coords.lng],
        "drop_coords": [input_data.drop_coords.lat, input_data.drop_coords.lng],
        "uber": uber_data,
        "rapido": rapido_data
    }

    # Save to JSON file with timestamp
    os.makedirs("fare_logs", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"fare_logs/fare_{input_data.place_name}_{input_data.destination_name}_{timestamp}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return output
