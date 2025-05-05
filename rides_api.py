from fastapi import FastAPI, Query
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import urllib.parse
import time
import uvicorn

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Ride API is running. Visit /docs for Swagger UI."}


def rapido(start_place: str, destination_place: str):
    options = Options()
    options.headless = True
    driver = webdriver.Chrome(options=options)

    encoded_start = urllib.parse.quote(start_place)
    encoded_destination = urllib.parse.quote(destination_place)
    url = f"https://m.rapido.bike/unup-home/seo/{encoded_start}/{encoded_destination}?version=v3"

    driver.get(url)
    time.sleep(5)

    fleet = []
    card_contents = driver.find_elements(By.CLASS_NAME, "card-content")
    for content in card_contents:
        fleet.append(content.text)

    fare = []
    card_contents = driver.find_elements(By.CLASS_NAME, "card-wrap")
    for content in card_contents:
        fare.append(content.text)

    driver.quit()
    results = []
    for i in range(len(fleet)):
        fleet_name = fleet[i].split("\n")[0]
        fare_details = fare[i].split("\n")
        fare_amount = fare_details[1] if len(fare_details) > 1 else "N/A"
        results.append({"fleet": fleet_name, "fare": fare_amount})

    return {"service": "Rapido", "start": start_place, "destination": destination_place, "options": results}


def uber(pickup_lat: float, pickup_lng: float, drop_lat: float, drop_lng: float):
    url = f'https://m.uber.com/go/product-selection?drop%5B0%5D=%7B%22latitude%22%3A{drop_lat}%2C%22longitude%22%3A{drop_lng}%7D&pickup=%7B%22latitude%22%3A{pickup_lat}%2C%22longitude%22%3A{pickup_lng}%7D'

    options = Options()
    options.add_argument(r"C:\Users\sheet\AppData\Local\Google\Chrome\User Data")
    options.add_argument("--profile-directory=Default")

    driver = webdriver.Chrome(options=options)
    driver.get(url)

    try:
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CLASS_NAME, "_css-jsRibq")))
    except:
        driver.quit()
        return {"service": "Uber", "error": "Failed to load"}

    fleets = [el.text for el in driver.find_elements(By.CLASS_NAME, "_css-jsRibq")]
    prices = [el.text for el in driver.find_elements(By.CLASS_NAME, "_css-jeMYle")]

    driver.quit()

    # Match fleets with prices by index
    options = []
    for i in range(min(len(fleets), len(prices))):
        options.append({"fleet": fleets[i], "price": prices[i]})

    return {
        "service": "Uber",
        "pickup": [pickup_lat, pickup_lng],
        "drop": [drop_lat, drop_lng],
        "options": options
    }


@app.get("/ride-options")
def get_ride_options(
    start_place: str = Query(...),
    destination_place: str = Query(...),
    pickup_lat: float = Query(...),
    pickup_lng: float = Query(...),
    drop_lat: float = Query(...),
    drop_lng: float = Query(...)
):
    rapido_data = rapido(start_place, destination_place)
    # uber_data = uber(pickup_lat, pickup_lng, drop_lat, drop_lng)
    # return {"Rapido": rapido_data, "Uber": uber_data}
    return {"Rapido": rapido_data}
