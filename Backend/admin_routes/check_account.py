from sqlalchemy import text
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS").split(',')

# (/check)
async def check_account(user_email, db):
    try:
        if user_email in ADMIN_EMAILS:
            # Checking admin table
                query = text("SELECT email FROM admins WHERE email = :email")
                result = await db.execute(query, {"email": user_email})
                rows = result.fetchall()
                # result contains admin data
                if rows:
                    return {"result": True,"account_type":"admin"}
                else:
                    # admin user not found in admin table so it will trigger frontend to setup admin account
                    return {"result": False,"account_type":"admin"}
        else:
            # Checking user table
            query = text("SELECT email FROM users WHERE email = :email")
            result = await db.execute(query, {"email": user_email})
            rows = result.fetchall()
            # result contains user data
            if rows:
                return {"result": True,"account_type":"client"}
            else:
                # Checking admin table
                query = text("SELECT email FROM admins WHERE email = :email")
                result = await db.execute(query, {"email": user_email})
                rows = result.fetchall()
                # result contains admin data
                if rows:
                    return {"result": True,"account_type":"admin"}
                else:
                    # no such user found
                    return {"result": False}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))