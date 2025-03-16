from sqlalchemy import text
from fastapi import HTTPException
import uuid

# Function for generating transaction id
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

# Route (/payment/create-order)
async def create_order(amount,razorpay_client,db):
    try:
        order_data = {
            "amount": amount,  # Amount in paise
            "currency": "INR",
            "receipt": await generate_unique_id(db),
        }
        order = razorpay_client.order.create(order_data)
        return {
                "result":True, 
                "order_id": order["id"], 
                "amount": amount, 
                "transaction_id": order_data["receipt"]
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))