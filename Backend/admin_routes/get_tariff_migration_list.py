from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/tariff-migration)
async def get_tariff_migration_list(plan_id,db):
    try:
        query = text("""
        SELECT 
            tariff_plans.plan_id,
            tariff_plans.plan_name
        FROM tariff_plans
        WHERE tariff_plans.plan_id != :plan_id
        """)

        result = await db.execute(query,{"plan_id":plan_id})
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