from sqlalchemy import text
from fastapi import HTTPException

# POST (/client/complaints)
async def update_client_complaint(body,client_email,db):
    try:
        query = text("""
                     UPDATE issues
                     SET issue_title = :title, issue_content = :content 
                     WHERE issue_no = :issue_no AND email = :client_email AND issue_status = true
            """)
        
        await db.execute(query, {
                                 "client_email":client_email,
                                 "issue_no":body["issue_no"],
                                 "title":body["subject"],
                                 "content":body["complaint"]
                                 }
                         )
        
        await db.commit()
        
        return {"result": True, "message":"Your Complaint is Updated."}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))