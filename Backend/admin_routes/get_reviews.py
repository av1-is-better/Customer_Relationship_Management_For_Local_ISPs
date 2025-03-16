from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/reviews)
async def get_reviews(user_email,offset,limit, db, is_admin):
    try:
        query = text("""
            WITH review_data AS (
                SELECT 
                    users.name, 
                    users.phone, 
                    users.email, 
                    reviews.review_no,
                    reviews.review_date,
                    reviews.review_rating,
                    reviews.review_description
                FROM users
                JOIN reviews ON users.email = reviews.email
                WHERE reviews.email = :email
                ORDER BY reviews.review_no DESC
            ),
            review_summary AS (
                SELECT 
                    COUNT(reviews.review_no) AS review_count
                FROM reviews
            )
            SELECT 
                rd.*, 
                rs.*
            FROM 
                review_data rd,
                review_summary rs
            """)
        
        client_query = text("""
            SELECT *
            FROM users
            WHERE email = :email
            """)
        
        if is_admin:
            query = text("""
            WITH review_data AS (
                SELECT 
                    users.name, 
                    users.phone, 
                    users.email, 
                    reviews.review_no,
                    reviews.review_date,
                    reviews.review_rating,
                    reviews.review_description
                FROM users
                JOIN reviews ON users.email = reviews.email
                ORDER BY reviews.review_no DESC
                LIMIT :limit
                OFFSET :offset
            ),
            review_summary AS (
                SELECT 
                    COUNT(reviews.review_no) AS review_count
                FROM reviews
            ),
            review_average AS (
                SELECT
                    AVG(review_rating) AS average_rating
                FROM
                    reviews   
            )
            SELECT 
                rd.*, 
                rs.*,
                ra.*
            FROM 
                review_data rd,
                review_summary rs,
                review_average ra""")

        
        result = await db.execute(query, {"email": user_email,"offset":offset,"limit":limit})
        rows = result.fetchall()
        
        # result contains data
        if rows and is_admin:
            review_data = [dict(row._mapping) for row in rows]
            return {"result": True,"data":review_data}
        
        if rows and not is_admin:
            review_data = [dict(row._mapping) for row in rows]
            client_result = await db.execute(client_query, {"email": user_email})
            client_rows = client_result.fetchall()
            if client_rows:
                client_data = [dict(row._mapping) for row in client_rows]
                # Convert the image (BYTEA) to base64
                client_data[0]["picture"] = base64.b64encode(client_data[0]['picture']).decode('utf-8')
                return {"result": True,"data":review_data,"client":client_data[0]}
        
        # result is empty
        return {"result": False}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))