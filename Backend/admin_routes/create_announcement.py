from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/announcements)
async def create_announcement(body,db):
    try:
        query = text("""
                     INSERT INTO announcements(title,message)
                     VALUES (:title, :message)
            """)
        
        await db.execute(query, {
                                 "title":body["title"],
                                 "message":body["message"]
                                 }
                         )
        
        await db.commit()
        
        return {"result": True, "message":"Announcement Created Successfully :)"}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))