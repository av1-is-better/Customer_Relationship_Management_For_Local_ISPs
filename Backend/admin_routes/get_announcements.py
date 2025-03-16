from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/announcements)
async def get_announcements(offset, limit, db, is_admin):
    try:
        query = text("""
            WITH announcement_data AS (
                SELECT 
                    id,
                    timestamp,
                    title,
                    message
                FROM announcements
                ORDER BY announcements.timestamp DESC
                LIMIT :limit
                OFFSET :offset
            ),
            announcement_count AS (
                SELECT 
                    COUNT(id) AS announcement_count
                FROM announcements
            )
            SELECT 
                ad.*, 
                ac.*
            FROM 
                announcement_data ad,
                announcement_count ac
            """)

        result = await db.execute(query, {"offset":offset,"limit":limit})
        rows = result.fetchall()
        
        # result contains data
        if rows:
            data = [dict(row._mapping) for row in rows]
            return {"result": True,"data":data}
        
        # result is empty
        return {"result": False}
    except Exception as e:
        db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))