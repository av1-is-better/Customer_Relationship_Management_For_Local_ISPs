from sqlalchemy import text
from fastapi import HTTPException

# GET (/admin/tariff-subscribers)
async def get_subscribers(plan_id,db):
    try:
        query = text("""
        SELECT name, phone, email
        FROM users
        WHERE plan_id = :plan_id
        ORDER BY users.name
        """)

        result = await db.execute(query,{"plan_id":plan_id})
        rows = result.fetchall()
        # result contains data
        if rows:
            result_with_columns = [dict(row._mapping) for row in rows]
            return {"result": True,"data":result_with_columns}
        # result is empty
        return {"result": False,"message":"No subscribers found :("}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))