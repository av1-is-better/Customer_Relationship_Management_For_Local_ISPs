from sqlalchemy import text
from fastapi import HTTPException
import uuid
from datetime import datetime

async def generate_unique_id(db):
    # Generates Unique ID
    id = str(uuid.uuid4()).replace('-','').upper()[0:25]

    # Check if ID Present in Database
    check_query = text("""SELECT id FROM transactions WHERE transactions.id = :id""")
    result = await db.execute(check_query, {"id": id})
    rows = result.fetchall()
    if rows:
        # Duplicate ID Found
        return await generate_unique_id(db)
    else:
        return id

# (/create-client)
async def make_new_transaction(transaction_data, db):
    
    # Validate and resize the uploaded image
    email = transaction_data["email"]
    mode =  transaction_data["mode"]
    amount = transaction_data["amount"]
    date = transaction_data["date"]
    # Convert the date string to a date object
    date_obj = datetime.strptime(date, '%Y-%m-%d').date()
    current_time = datetime.now().time()
    timestamp = datetime.combine(date_obj, current_time)
    # Random Transaction ID
    id = await generate_unique_id(db)

    try:

        # Transaction Insert Query for Database
        insert_query = text("""
        INSERT INTO transactions(id, mode, amount, date, email, transaction_timestamp, auto_generated)
        VALUES(:id, :mode, :amount, :date, :email, :timestamp, :auto_generated)
        """)

        await db.execute(insert_query, {"id":id, "mode":mode, "amount":int(amount), "date":date_obj, "email":email, "timestamp": timestamp, "auto_generated":False})
        await db.commit()

        return {"result": True, "message":"Transaction Created Successfully :)"}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))