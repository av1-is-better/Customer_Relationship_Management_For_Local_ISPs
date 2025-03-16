from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/client-profile)
async def get_client_transactions(email,offset,limit,db):
    try:
        count_query = text("""
        SELECT count(invoice) as transaction_count
        FROM transactions
        WHERE transactions.email = :email
        """)

        count_result = await db.execute(count_query,{"email":email})
        count = count_result.fetchall()
        count = int([dict(row._mapping) for row in count][0]["transaction_count"])
        
        if count>0:
            transaction_query = text("""
                SELECT *
                FROM transactions
                WHERE transactions.email = :email
                ORDER BY invoice DESC
                OFFSET :offset
                LIMIT :limit
            """)

            transaction_result = await db.execute(transaction_query,{"email":email,"offset":offset,"limit":limit})
            transaction_rows = transaction_result.fetchall()
            # result contains transaction data
            if transaction_rows:
                transaction_result_with_columns = [dict(row._mapping) for row in transaction_rows]
                return {"result": True,"transaction_count":count,"data":transaction_result_with_columns}
        else:
            return {"result": False,"transaction_count":count,"message":"No Transactions Found"}
    
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))