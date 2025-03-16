import requests
from jose import jwt
from jose.exceptions import JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
import os
from dotenv import load_dotenv
from Crypto.Cipher import AES
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from dependencies.get_db import get_db
import base64
import hashlib

HTTP_BEARER = HTTPBearer()

load_dotenv()

AUTH0_CREDS = {
    "domain": str(os.getenv("AUTH0_DOMAIN")),
    "audience": str(os.getenv("AUTH0_AUDIENCE")),
    "namespace": str(os.getenv("AUTH0_EMAIL_NAMESPACE"))
    }

ADMIN_EMAILS = os.getenv("ADMIN_EMAILS").split(',')

# Helper function to unpad PKCS#7 padding
async def unpad(data: bytes) -> bytes:
    padding_len = data[-1]  # The last byte indicates the padding length
    return data[:-padding_len]

# Decrypt function with unpadding
async def decrypt_email(encrypted_email: str, key: str) -> str:
    encrypted_email = encrypted_email.split(':')
    iv = bytes.fromhex(encrypted_email[0])
    encrypted_data = bytes.fromhex(encrypted_email[1])

    # Create the AES cipher object
    cipher = AES.new(bytes.fromhex(key), AES.MODE_CBC, iv)

    # Decrypt the data
    decrypted_data = cipher.decrypt(encrypted_data)
    
    # Unpad the decrypted data
    decrypted_data = await unpad(decrypted_data)
    
    return decrypted_data.decode('utf-8')

async def decode_access_token(token: str, AUTH0_CREDS:dict, db):
    # Initializing Variables
    AUTH0_DOMAIN = AUTH0_CREDS["domain"]
    API_IDENTIFIER = AUTH0_CREDS["audience"]
    AUTH0_EMAIL_NAMESPACE = AUTH0_CREDS["namespace"]
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    jwks_url = f'https://{AUTH0_DOMAIN}/.well-known/jwks.json'
    jwks = requests.get(jwks_url).json()
    
    kid = unverified_header['kid']
    
    rsa_key = None
    for key in jwks['keys']:
        if key['kid'] == kid:
            rsa_key = {
                'kty': key['kty'],
                'kid': key['kid'],
                'use': key['use'],
                'n': key['n'],
                'e': key['e']
            }

    if rsa_key:
        try:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms="RS256",
                audience=API_IDENTIFIER,
                issuer=f"https://{AUTH0_DOMAIN}/"
            )
            # Email Included in Token
            if AUTH0_EMAIL_NAMESPACE in payload:
                encrypted_email = payload[AUTH0_EMAIL_NAMESPACE]
                decrypted_email = await decrypt_email(encrypted_email,os.getenv("AES_DECRYPTION_KEY"))
                # Email Included in Admin List
                if decrypted_email in ADMIN_EMAILS:
                    return decrypted_email
                else:
                    query = text("""
                                 SELECT email FROM admins 
                                 WHERE email = :email
                                 """)
                    result = await db.execute(query,{"email":decrypted_email})
                    rows = result.fetchall()
                    if rows:
                        return decrypted_email
                    else:
                        raise HTTPException(status_code=403, detail="Unauthorized email for admin")
            else:
                raise HTTPException(status_code=403, detail="Invalid token")

        except JWTError:
            raise HTTPException(status_code=403, detail="Invalid token")
    raise HTTPException(status_code=403, detail="RSA key not found")

async def get_admin_email(token: str = Depends(HTTP_BEARER),db: AsyncSession = Depends(get_db)):
    global AUTH0_CREDS
    print("token verified")
    return await decode_access_token(token.credentials,AUTH0_CREDS,db)