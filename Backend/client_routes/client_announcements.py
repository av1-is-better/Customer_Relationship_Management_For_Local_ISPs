from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/client-profile)
async def get_client_announcements(offset,limit,db):
    try:
        count_query = text("""
                           SELECT COUNT(id) as announcement_count FROM announcements
                           """)
        count_result = await db.execute(count_query,{"offset":offset,"limit":limit})
        count_rows = count_result.fetchall()
        count = [dict(row._mapping) for row in count_rows][0]["announcement_count"]
        
        # Announcement Found in Database
        if count > 0:
            announcement_query = text("""
                SELECT * FROM announcements
                ORDER BY id DESC 
                OFFSET :offset
                LIMIT :limit
            """)

            announcement_result = await db.execute(announcement_query,{"offset":offset,"limit":limit})
            announcement_rows = announcement_result.fetchall()
            # result contains announcement data
            if announcement_rows:
                announcement_result_with_columns = [dict(row._mapping) for row in announcement_rows]
                return {"result": True,"announcement_count":count,"data":announcement_result_with_columns}
            else:
                return {"result": False,"announcement_count":count,"message":"No Announcements Found"}
        
        else:
            return {"result": False,"announcement_count":count,"message":"No Announcements Found"}
    
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))