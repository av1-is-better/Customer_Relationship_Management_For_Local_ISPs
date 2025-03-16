from sqlalchemy import text
from fastapi import HTTPException

# POST (/client/feedback)
async def create_review(body,client_email,db):
    try:
        review_rating = body["rating"]
        review_description = body["feedback"]
        
        # Checking existing reviews
        check_query = text("""
                           SELECT * FROM reviews WHERE email = :email;
                           """)
        check_result = await db.execute(check_query,{
            "email": client_email
        })
        
        check_rows = check_result.fetchall()
        
        if check_rows:
            # Deleting Existing Feedback
            delete_query = text("""
                                DELETE FROM reviews WHERE email = :email
                                """)
            await db.execute(delete_query, { "email":client_email })
            
        # Inserting New Feedback
        insert_query = text("""
                         INSERT INTO reviews(review_rating, review_description, email)
                         VALUES (:review_rating, :review_description, :email)
                """)

        await db.execute(insert_query, {
                                     "review_rating":review_rating,
                                     "review_description":review_description,
                                     "email":client_email
                                     }
                             )

        await db.commit()

        return {"result": True, "message":"Thank You, For your feedback."}

    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))