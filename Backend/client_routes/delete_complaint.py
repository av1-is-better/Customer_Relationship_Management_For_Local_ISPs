from sqlalchemy import text
from fastapi import HTTPException

# POST (/client/complaints)
async def delete_client_complaint(issue_no,client_email,db):
    try:
        print(issue_no)
        query = text("""
                     DELETE FROM issues
                     WHERE issue_no = :issue_no AND email = :client_email AND issue_status = true
            """)
        
        await db.execute(query, {
                                 "client_email":client_email,
                                 "issue_no":issue_no
                                 }
                         )
        
        await db.commit()
        
        return {"result": True, "message":"You've Successfully Deleted Your Complaint."}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))