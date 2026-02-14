import requests
import json

BASE_URL = 'http://localhost:8000/api'

def test_login():
    print("Testing Login...")
    url = f"{BASE_URL}/token/"
    data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            tokens = response.json()
            print("Login Successful!")
            print(f"Access Token: {tokens.get('access')[:20]}...")
            return tokens.get('access')
        else:
            print(f"Login Failed: {response.text}")
            return None
    except Exception as e:
        print(f"Error during login: {e}")
        return None

def test_me(access_token):
    print("\nTesting 'users/me/' endpoint...")
    url = f"{BASE_URL}/users/me/"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user = response.json()
            print("User Retrieval Successful!")
            print(f"User Data: {user}")
        else:
            print(f"User Retrieval Failed: {response.text}")
    except Exception as e:
        print(f"Error during user retrieval: {e}")

if __name__ == "__main__":
    token = test_login()
    if token:
        test_me(token)
