from sqlalchemy import text
from fastapi import HTTPException

# (/admin/complaints)
async def resolve_complaint(client_email,status,issue_no,db):
    try:
        # Query To Resolve Complaint
        query = text("""
        UPDATE issues
        SET issue_status = :status
        WHERE issue_no = :issue_no AND email = :client_email
        """)
        result = await db.execute(query, {"client_email":client_email, "status": bool(status), "issue_no":issue_no})
        await db.commit()
        if status:
            return {"result": True, "message":"This Complaint is Now in Active State."}
        else:
            return {"result": True, "message":"This Complaint Has Been Resolved :)"}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))