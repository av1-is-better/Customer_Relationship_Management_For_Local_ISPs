from sqlalchemy import text
from fastapi import HTTPException

# (/admin/complaints)
async def delete_complaint(client_email,issue_no,db):
    try:
        # Query To Resolve Complaint
        query = text("""
        DELETE FROM issues
        WHERE issue_no = :issue_no AND email = :client_email
        """)
        result = await db.execute(query, {"client_email":client_email, "issue_no":issue_no})
        await db.commit()
        return {"result": True, "message":"Complaint Deleted Successfully :)"}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))