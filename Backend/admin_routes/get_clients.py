from sqlalchemy import text
from fastapi import HTTPException

# (/admin/clients)
async def get_clients(db):
    try:
        # Parameterized query using :email as a placeholder
        query = text("""
        SELECT 
            users.name, 
            users.phone, 
            users.email, 
            users.address, 
            users.gender, 
            users.city, 
            users.area_code, 
            users.id_type, 
            users.id_value, 
            users.user_id, 
            users.plan_id,
            tariff_plans.plan_name,
            tariff_plans.plan_cost,
            CONCAT(tariff_plans.plan_speed, ' ', tariff_plans.speed_unit) AS plan_speed,
            CONCAT(tariff_plans.plan_validity, ' ', tariff_plans.validity_unit) AS plan_validity,
            tariff_plans.plan_cost,
            COUNT(transactions.id) AS user_transaction_count
        FROM users
        JOIN tariff_plans ON users.plan_id = tariff_plans.plan_id
        LEFT JOIN transactions ON users.email = transactions.email
        GROUP BY 
            users.name, 
            users.phone, 
            users.email, 
            users.address, 
            users.gender, 
            users.city, 
            users.area_code, 
            users.id_type, 
            users.id_value, 
            users.user_id, 
            users.plan_id,
            tariff_plans.plan_name,
            tariff_plans.plan_cost,
            tariff_plans.plan_speed,
            tariff_plans.speed_unit,
            tariff_plans.plan_validity,
            tariff_plans.validity_unit
        ORDER BY users.name;
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