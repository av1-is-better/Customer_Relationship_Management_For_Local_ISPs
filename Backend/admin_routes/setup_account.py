from sqlalchemy import text
from fastapi import HTTPException
import os
from dotenv import load_dotenv

load_dotenv()
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS").split(',')

# (/setup-account)
async def setup_account(user, user_email, db):
    user_name = user.model_dump()["name"]
    user_phone = user.model_dump()["phone"]
    try:
        # Parameterized query using :email as a placeholder
        query = text("INSERT INTO users(email,name,phone) VALUES(:email,:name,:phone)")
        if user_email in ADMIN_EMAILS:
            query = text("INSERT INTO admins(email,name,phone) VALUES(:email,:name,:phone)")
        await db.execute(query, {"email": user_email,"name":user_name,"phone":user_phone})
        await db.commit()
        return {"result": True}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))