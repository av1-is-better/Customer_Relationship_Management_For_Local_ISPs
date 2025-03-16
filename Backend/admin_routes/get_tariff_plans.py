from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/tariff)
async def get_tariff(db):
    try:
        query = text("""
        SELECT 
            tariff_plans.plan_id,
            tariff_plans.plan_name,
            tariff_plans.plan_speed,
            tariff_plans.speed_unit,
            tariff_plans.plan_validity,
            tariff_plans.validity_unit,
            tariff_plans.plan_cost, 
            COUNT(users.email) AS subscribers
        FROM tariff_plans
        LEFT JOIN users ON tariff_plans.plan_id = users.plan_id
        GROUP BY tariff_plans.plan_id
        ORDER BY tariff_plans.plan_id;
        """)

        result = await db.execute(query)
        rows = result.fetchall()
        # result contains data
        if rows:
            result_with_columns = [dict(row._mapping) for row in rows]
            return {"result": True,"data":result_with_columns}
        # result is empty
        return {"result": False}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))