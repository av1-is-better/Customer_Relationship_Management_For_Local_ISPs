from sqlalchemy import text
from fastapi import HTTPException
import base64
import os
from encryption_handler.encryption_handler import decode_string
from dotenv import load_dotenv

load_dotenv()

# (/dashboard)
# search_mode: "all" Fetch All Users Data, "phone" Fetch Using user's phone, "name" Fetch Using user's name
async def get_password(email,db):
    try:
        # Checking User Exist
        query = text("""
        SELECT email
        FROM users
        WHERE users.email = :email
        """)

        result = await db.execute(query,{"email":email})
        rows = result.fetchall()
        # result contains data
        if not rows:
            return {"result": False, "message": "No Such User Found in Database"}
        else:
            query = text("SELECT password FROM passwords WHERE email = :email")
            result = await db.execute(query,{"email":email})
            rows = result.fetchall()
            result_with_columns = [dict(row._mapping) for row in rows]
            
            # Decrypting Password using Key from .env
            raw_password = decode_string(result_with_columns[0]["password"],os.getenv("PASSWORD_ENCRYPTION_KEY"))
            
            # Returning Base64 Encoded Password
            return {"result": True, "password":base64.b64encode(raw_password.encode("utf-8"))}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))