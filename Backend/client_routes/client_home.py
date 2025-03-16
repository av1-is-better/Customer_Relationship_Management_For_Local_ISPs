from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/client-profile)
async def get_client_home(email,db):
    try:
        response_data = {}
        query = text("""
        SELECT *
        FROM users
        JOIN tariff_plans ON users.plan_id = tariff_plans.plan_id
        WHERE users.email = :email
        """)

        result = await db.execute(query,{"email":email})
        rows = result.fetchall()
        # result contains data
        if rows:
            result_with_columns = [dict(row._mapping) for row in rows]
            # Convert the image (BYTEA) to base64
            base_64_picture = base64.b64encode(result_with_columns[0]['picture']).decode('utf-8')
            result_with_columns[0]["picture"] = base_64_picture
            response_data["client"] = result_with_columns[0]
        
        else:
            raise HTTPException(status_code=400, detail=str(e)) 
            
            
        transaction_query = text("""
        SELECT *
        FROM transactions
        WHERE transactions.email = :email
        ORDER BY invoice DESC
        LIMIT 1
        """)

        transaction_result = await db.execute(transaction_query,{"email":email})
        transaction_rows = transaction_result.fetchall()
        # result contains data
        if transaction_rows:
            transaction_result_with_columns = [dict(row._mapping) for row in transaction_rows]
            transaction_result_with_columns[0]["result"] = True
            response_data["transaction"] = transaction_result_with_columns[0]
        else:
            response_data["transaction"] = {"result":False}
            
            
        # checking feedback given by client or not
        review_query = text("""
        select review_no from reviews where email = :email
        """)

        review_result = await db.execute(review_query,{"email":email})
        review_rows = review_result.fetchall()
        # 
        if review_rows:
            response_data["feedback_given_by_client"] = True # Feedback is already given by this user
        else:
            # checking whether client has any auto generated transactions
            # client can only give feedback when there's razorpay transaction in his account
            # because without doing any online transaction how can client able to share his experience with us.
            
            auto_generated_transaction_query = text("""
                                                        SELECT id FROM transactions WHERE email = :email AND auto_generated = :auto_generated LIMIT 2
                                                """)
            auto_generated_transaction_query_result = await db.execute(auto_generated_transaction_query,{"email":email,"auto_generated":True})
            auto_generated_transaction_query_rows = auto_generated_transaction_query_result.fetchall()
            auto_generated_transaction_query_columns = [ dict(row._mapping) for row in auto_generated_transaction_query_rows ]
            
            if auto_generated_transaction_query_rows:
                if len(auto_generated_transaction_query_columns) > 1:
                    # client must have atleast 2 auto_generated transactions
                    response_data["feedback_given_by_client"] = False
                else:
                    # This means that client have auto generated transaction but haven't given feedback yet
                    response_data["feedback_given_by_client"] = True
            
            else:
                # This means that client does not have auto generated transaction
                response_data["feedback_given_by_client"] = True
        
        return {"result": True,"data":response_data}
    
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))