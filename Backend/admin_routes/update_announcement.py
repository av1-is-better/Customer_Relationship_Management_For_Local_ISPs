from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/announcements)
async def update_announcement(body,db):
    try:
        query = text("""
                     UPDATE announcements
                     SET title = :title, message = :message
                     WHERE id = :id
            """)
        
        await db.execute(query, {"id":body["id"],
                                 "title":body["title"],
                                 "message":body["message"]
                                 }
                         )
        
        await db.commit()
        
        return {"result": True, "message":"Announcement Updated Successfully :)"}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))