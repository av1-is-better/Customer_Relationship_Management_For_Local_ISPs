from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/announcements)
async def delete_announcement(id,db):
    try:
        query = text("""
                     DELETE FROM announcements WHERE id = :id
            """)
        
        await db.execute(query, {"id":id})
        await db.commit()
        return {"result": True, "message":"Announcement Deleted Successfully :)"}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))