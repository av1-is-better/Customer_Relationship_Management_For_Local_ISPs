from sqlalchemy import text
from fastapi import HTTPException
from datetime import datetime

# (/create-client)
async def delete_transaction(transaction_data, db):
    id = transaction_data["id"]
    
    try:
        # checking whether this transaction is auto generated or not because only manually created transactions can be deleted.
        check_query = text("""
            SELECT auto_generated
            FROM transactions
            WHERE id = :id
            """)
        check_result = await db.execute(check_query, {"id":id})
        rows = check_result.fetchall()
        # data fetched from database
        if rows:
            # extracting auto_generated status of this transaction
            auto_generated = [dict(row._mapping) for row in rows][0]["auto_generated"]
            
            # Transaction is manually created so it can be deleted.
            if not auto_generated:
                delete_query = text("""     
                                    DELETE FROM transactions
                                    WHERE id = :id
                                """)
                await db.execute(delete_query, {"id":id})
                await db.commit()
                return {"result": True, "message":"Transaction Deleted Successfully :)"}
            
            # Transaction cannot be deleted because it is auto generated.
            else:
                raise HTTPException(status_code=400, detail=str("This Transaction Cannot be Deleted Because it is Auto Generated at The Time of Transaction :("))
        
        # No Such Transaction in database
        else:
            raise HTTPException(status_code=400, detail=str("No Such Transaction Found in Database :("))
    
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))