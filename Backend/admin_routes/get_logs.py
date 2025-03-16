from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/logs)
async def get_logs(offset,limit, db):
    try:
        query = text("""
            WITH log_data AS (
        	SELECT *
        	FROM logs
        	ORDER BY log_timestamp DESC
            LIMIT :limit
            OFFSET :offset
        ),
        log_count AS (
        	SELECT COUNT(log_timestamp) as log_count
        	FROM logs
        )
        SELECT 
        	ld.*, 
            lc.*
        FROM
        	log_data ld,
            log_count lc
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