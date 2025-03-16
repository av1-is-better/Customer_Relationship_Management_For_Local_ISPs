from sqlalchemy import text
from fastapi import HTTPException
import razorpay
from sqlalchemy import text
from datetime import date

# Route (/payment/create-order)
async def verify_order(body_data,razorpay_client,client_email,db):
    transaction_mode = None
    amount = int(body_data["amount"]/100) # Converting Amount to rupees
    transaction_id = str(body_data["transaction_id"])
    
    # Verifying Payment Success
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': body_data["razorpay_order_id"],
            'razorpay_payment_id': body_data["razorpay_payment_id"],
            'razorpay_signature': body_data["razorpay_signature"],
        })
    except razorpay.errors.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Fetch Payment Details
    try:
        payment_details = razorpay_client.payment.fetch(body_data["razorpay_payment_id"])
        payment_method = payment_details.get("method")  # Get the payment method

        # Determine the transaction mode based on the payment method
        if payment_method == "upi":
            transaction_mode = "UPI"
        elif payment_method == "card":
            card_details = payment_details.get("card", {})
            card_type = card_details.get("type")  # 'credit' or 'debit'
            if card_type == "credit":
                transaction_mode = "CREDIT CARD"
            elif card_type == "debit":
                transaction_mode = "DEBIT CARD"
        elif payment_method == "netbanking":
            transaction_mode = "NETBANKING"

        # Ensure a transaction mode was determined
        if not transaction_mode:
            transaction_mode = "NETBANKING"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment details: {str(e)}")
    
    try:
        # Inserting Transaction Into Database
        insert_query = text("""
        INSERT INTO transactions(id,mode,amount,date,email,auto_generated)
        VALUES(:id, :mode, :amount, :date, :email, :auto_generated)
        """)
        await db.execute(insert_query, {"id":transaction_id, "mode":transaction_mode, "amount":amount, "date":date.today(), "email":client_email, "auto_generated":True})
        await db.commit()
        
        # Fetching Transaction Data From Database
        fetch_query = text("""
                           SELECT * FROM transactions WHERE id = :id AND email = :email
                           """)
        fetched_data = await db.execute(fetch_query, {"id":transaction_id, "email":client_email})
        transaction_rows = fetched_data.fetchall()
        if transaction_rows:
                transaction_result_with_columns = [dict(row._mapping) for row in transaction_rows][0]
                return {
                        "result": True, 
                        "data":transaction_result_with_columns,
                        "message":"Transaction Completed Successfully :)"
                        }
    
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=f"Error inserting transaction in database: {str(e)}")