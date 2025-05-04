from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
from selenium.webdriver.chrome.options import Options


def extract_fleet_and_price(driver):
    """
    Function to extract fleet and price information from the Uber page.

    Args:
    driver: The Selenium WebDriver instance.
    """
    # Extract fleet info
    card_contents = driver.find_elements(By.CLASS_NAME, "_css-jsRibq")
    print("\nFleet (element.innerText):")
    for content in card_contents:
        print(content.text)

    # Extract price info
    card_contents = driver.find_elements(By.CLASS_NAME, "_css-jeMYle")
    print("\nPrice (element.innerText):")
    for content in card_contents:
        print(content.text)
        
        
def main():
    # Hardcoded coordinates for pickup and drop-off
    pickup_lat = 12.8949688
    pickup_lng = 77.67573949999999
    drop_lat = 12.9566524
    drop_lng = 77.7007623
    
    # Construct URL with hardcoded coordinates
    url = f'https://m.uber.com/go/product-selection?drop%5B0%5D=%7B%22latitude%22%3A{drop_lat}%2C%22longitude%22%3A{drop_lng}%7D&pickup=%7B%22latitude%22%3A{pickup_lat}%2C%22longitude%22%3A{pickup_lng}%7D'

    # Set up Chrome options
    options = Options()
    options.add_argument(r"C:\Users\sheet\AppData\Local\Google\Chrome\User Data")
    options.add_argument("profile-directory=Default")

    # Start the browser
    driver = webdriver.Chrome(options=options)

    # Open the URL
    driver.get(url)

    # Debug: Print the current URL
    print("Current URL:", driver.current_url)

    # Wait for the page to load completely
    try:
        WebDriverWait(driver, 2000).until(EC.presence_of_element_located((By.CLASS_NAME, "_css-jsRibq")))
    except Exception as e:
        print("Error waiting for page to load:", e)
        driver.quit()
        return

    # Call the function to extract fleet and price information
    extract_fleet_and_price(driver)

    # Close the browser
    driver.quit()

if __name__ == "__main__":
    main()