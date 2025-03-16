from sqlalchemy import text
from fastapi import HTTPException
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# (/delete-client)
async def delete_client(client_email,m2m_token,db):
    try:
        # Checking If User is Present in Database
        check_query = text("SELECT user_id FROM users WHERE email = :email")
        result = await db.execute(check_query, {"email": client_email})
        rows = result.fetchall()
        if rows:
            result_with_columns = [dict(row._mapping) for row in rows]
            user_id = result_with_columns[0]["user_id"]

            # Checking If User Has Any Transactions
            check_query = text("SELECT email FROM transactions WHERE email = :email")
            result = await db.execute(check_query, {"email": client_email})
            rows = result.fetchall()
            if rows:
                # DELETEING USER's TRANSACTIONS
                update_query = text("""DELETE FROM transactions
                                    WHERE email = :email""")
                await db.execute(update_query, {"email": client_email})

            # Checking If User Has Any Complaints
            check_query = text("SELECT email FROM issues WHERE email = :email")
            result = await db.execute(check_query, {"email": client_email})
            rows = result.fetchall()
            if rows:
                # DELETEING USER's Complaints
                update_query = text("""DELETE FROM issues
                                    WHERE email = :email""")
                await db.execute(update_query, {"email": client_email})
            
             # Checking If User Has Given Any Reviews
            check_query = text("SELECT email FROM reviews WHERE email = :email")
            result = await db.execute(check_query, {"email": client_email})
            rows = result.fetchall()
            if rows:
                # DELETEING USER's Reviews
                update_query = text("""DELETE FROM reviews
                                    WHERE email = :email""")
                await db.execute(update_query, {"email": client_email})
            
            # DELETING USER's PASSWORD
            update_query = text("""DELETE FROM passwords
                                WHERE email = :email""")
            await db.execute(update_query, {"email": client_email})
            
            # DELETING USER
            update_query = text("""DELETE FROM users
                                WHERE email = :email""")
            await db.execute(update_query, {"email": client_email})

            # Calling AUTH0 API For Deleting User
            url = f"https://{str(os.getenv("AUTH0_DOMAIN"))}/api/v2/users/auth0|{user_id}"
            headers = {
                "Authorization": f"Bearer {m2m_token}"
            }

            response = requests.delete(url, headers=headers)
    
            if response.status_code != 204:
                await db.rollback()  # Rollback the transaction on error
                raise HTTPException(status_code=400, detail=str(e))

            
            # COMMITING CHANGES TO DATABASE
            await db.commit()
            return {"result": True, "message":"Client Deleted Successfully :)"}
        
        else:
            return {"result": False,"reason":"No Such Client Found."}

    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))