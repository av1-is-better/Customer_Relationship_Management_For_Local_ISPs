import requests
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()

AUTH0_CREDS = {
    "domain": str(os.getenv("AUTH0_DOMAIN")),
    "audience": f"https://{str(os.getenv("AUTH0_DOMAIN"))}/api/v2/",
    "client_id": str(os.getenv("AUTH0_M2M_CLIENT_ID")),
    "client_secret": str(os.getenv("AUTH0_M2M_CLIENT_SECRET"))
    }

def fetch_token(AUTH0_CREDS):
    url = f"https://{AUTH0_CREDS['domain']}/oauth/token"
    headers = {"content-type": "application/json"}
    data = {
        "client_id": AUTH0_CREDS["client_id"],
        "client_secret": AUTH0_CREDS["client_secret"],
        "audience": AUTH0_CREDS["audience"],
        "grant_type": "client_credentials"
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        token = response.json()["access_token"]
        return token
    except requests.exceptions.HTTPError as http_err:
        raise HTTPException(status_code=403, detail="Failed To Get Auth0 Management API Token.")
    except requests.exceptions.ConnectionError as conn_err:
        raise HTTPException(status_code=403, detail="Failed To Get Auth0 Management API Token")
    except requests.exceptions.Timeout as timeout_err:
        raise HTTPException(status_code=403, detail="Failed To Get Auth0 Management API Token")
    except requests.exceptions.RequestException as req_err:
        raise HTTPException(status_code=403, detail="Failed To Get Auth0 Management API Token")
    raise HTTPException(status_code=403, detail="Failed To Get Auth0 Management API Token")


async def get_auth0_management_token():
    global AUTH0_CREDS
    return fetch_token(AUTH0_CREDS)