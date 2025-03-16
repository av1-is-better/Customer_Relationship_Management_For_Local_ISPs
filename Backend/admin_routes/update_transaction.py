from sqlalchemy import text
from fastapi import HTTPException
from datetime import datetime

# (/update-transaction)
async def update_transaction(transaction_data, db):

    id = transaction_data["id"]
    mode =  transaction_data["mode"]
    amount = transaction_data["amount"]
    date = transaction_data["date"]
    # Convert the date string to a date object
    date_obj = datetime.strptime(date, '%Y-%m-%d').date()
    current_time = datetime.now().time()
    timestamp = datetime.combine(date_obj, current_time)

    try:
        # checking whether this transaction is auto generated or not because only manually created transactions can be modified.
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
            
            # Transaction is manually created so it can be modified.
            if not auto_generated:
                update_query = text("""     
                                    UPDATE transactions
                                    SET mode = :mode, amount = :amount, date = :date, transaction_timestamp = :timestamp
                                    WHERE id = :id
                                """)
                await db.execute(update_query, {"id":id, "mode":mode, "amount":int(amount), "date":date_obj, "timestamp":timestamp})
                await db.commit()
                return {"result": True, "message":"Transaction Updated Successfully :)"}
            
            # Transaction cannot be modified because it is auto generated.
            else:
                return { "result": False, "message": "This Transaction Cannot be Modified Because it is Auto Generated at The Time of Transaction :(" }
        # No Such Transaction
        else:
            return { "result": False, "message": "No Such Transaction Found in Database :(" }
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))