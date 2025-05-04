from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import time
import urllib.parse
from selenium.webdriver.chrome.options import Options
options = Options()
options.headless = True  # Run in headless mode
driver = webdriver.Chrome(options=options)



start_place = "Amrita Nagar, Choodasandra, Junnasandra, Bengaluru, Karnataka 560035, India"
destination_place = "518, Varthur Main Rd, Subbaiah Reddy Colony, Marathahalli Village, Marathahalli, Bengaluru, Karnataka 560037, India"
encoded_start = urllib.parse.quote(start_place)
encoded_destination = urllib.parse.quote(destination_place)
# Open the URL
# url = "https://m.rapido.bike/unup-home/seo/Amrita%20Vishwa%20Vidyapeetam,%20Bengaluru,%20Amrita%20Nagar,%20Choodasandra,%20Junnasandra,%20Karnataka,%20India/KLM%20Fashion%20Mall,%20Marathahalli,%20Varthur%20Main%20Road,%20Subbaiah%20Reddy%20Colony,%20Marathahalli%20Village,%20Marathahalli,%20Bengaluru,%20Karnataka,%20India?version=v3"
url = f"https://m.rapido.bike/unup-home/seo/{encoded_start}/{encoded_destination}?version=v3"
driver.get(url)


# Wait for JS to render the elements
time.sleep(5)  # You can use WebDriverWait for more robustness

# Extract from card-wrap elements: element.children[1].innerText
card_wraps = driver.find_elements(By.CLASS_NAME, "card-wrap")
print("From card-wrap (element.children[1].innerText):")
for card in card_wraps:
    try:
        text = card.find_elements(By.XPATH, "./*")[1].text
        print(text)
    except IndexError:
        print("[!] Less than 2 children in this card element.")

# Extract from card-content elements: element.innerText
card_contents = driver.find_elements(By.CLASS_NAME, "card-content")
print("\nFrom card-content (element.innerText):")
for content in card_contents:
    print(content.text)

# Close browser
driver.quit()