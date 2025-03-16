from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/transactions, /admin/client-transaction)
async def get_transactions(user_email, db, offset, limit, is_admin):
    try:
        query = text("""
            SELECT *
            FROM transactions
            WHERE email = :email
            ORDER BY transactions.transaction_timestamp DESC
            """)
        
        client_query = text("""
            SELECT *
            FROM users
            JOIN tariff_plans ON users.plan_id = tariff_plans.plan_id
            WHERE users.email = :email
            """)
        
        if is_admin:
            query = text("""
            WITH transaction_data AS (
                SELECT 
                    users.name, 
                    users.phone, 
                    users.email, 
                    transactions.invoice, 
                    transactions.id, 
                    transactions.date, 
                    transactions.mode, 
                    transactions.amount,
                    transactions.transaction_timestamp,
                    transactions.auto_generated
                FROM users
                JOIN transactions ON users.email = transactions.email
                ORDER BY transactions.transaction_timestamp DESC
                OFFSET :offset
                LIMIT :limit
            ),
            transaction_summary AS (
                SELECT 
                    COUNT(transactions.invoice) AS transaction_count
                FROM transactions)
            SELECT 
                td.*, 
                ts.*
            FROM 
                transaction_data td,
                transaction_summary ts""")

        
        result = await db.execute(query, {"email": user_email, "offset":offset, "limit":limit})
        rows = result.fetchall()
        
        # result contains data
        if rows and is_admin:
            transaction_data = [dict(row._mapping) for row in rows]
            return {"result": True,"data":transaction_data}
        if rows and not is_admin:
            transaction_data = [dict(row._mapping) for row in rows]
            client_result = await db.execute(client_query, {"email": user_email})
            client_rows = client_result.fetchall()
            if client_rows:
                client_data = [dict(row._mapping) for row in client_rows]
                # Convert the image (BYTEA) to base64
                client_data[0]["picture"] = base64.b64encode(client_data[0]['picture']).decode('utf-8')
                return {"result": True,"data":transaction_data,"client":client_data[0]}
        
        # result is empty
        return {"result": False}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))