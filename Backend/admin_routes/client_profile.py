from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/client-profile)
async def get_profile(email,db):
    try:
        query = text("""
        SELECT *
        FROM users
        JOIN tariff_plans ON users.plan_id = tariff_plans.plan_id
        WHERE users.email = :email
        """)

        result = await db.execute(query,{"email":email})
        rows = result.fetchall()
        # result contains data
        if rows:
            result_with_columns = [dict(row._mapping) for row in rows]
            # Convert the image (BYTEA) to base64
            base_64_picture = base64.b64encode(result_with_columns[0]['picture']).decode('utf-8')
            result_with_columns[0]["picture"] = base_64_picture
            return {"result": True,"data":result_with_columns}
        # result is empty
        return {"result": False}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))