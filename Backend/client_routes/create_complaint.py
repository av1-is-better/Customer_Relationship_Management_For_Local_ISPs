from sqlalchemy import text
from fastapi import HTTPException

# POST (/client/complaints)
async def create_complaint(body,client_email,db):
    try:
        query = text("""
                     INSERT INTO issues(email, issue_title, issue_content)
                     VALUES (:client_email, :title, :content)
            """)
        
        await db.execute(query, {
                                 "client_email":client_email,
                                 "title":body["subject"],
                                 "content":body["complaint"]
                                 }
                         )
        
        await db.commit()
        
        return {"result": True, "message":"Your Complaint is Submitted Successfully."}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))