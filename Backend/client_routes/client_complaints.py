from sqlalchemy import text
from fastapi import HTTPException

# (/client/complaints)
async def fetch_client_complaints(status,limit,offset,client_email,db):
    try:
        # Query To Fetch Currently Active Complaints
        query = text("""
        WITH issue_data AS (
        	SELECT 
        	    issues.issue_date,
        	    issues.issue_no,
        	    issues.issue_title,
        	    issues.issue_content,
        	    issues.issue_status,
                issues.issue_timestamp
        	FROM issues
        	WHERE issues.issue_status = true AND issues.email = :email
        	ORDER BY issue_no DESC
            OFFSET :offset
            LIMIT :limit
        ),
        issue_count AS (
        	SELECT COUNT(issues.issue_no) as complaint_count
        	FROM issues
        	WHERE issues.issue_status = true AND issues.email = :email
        )
        SELECT 
        	id.*, 
            ic.*
        FROM
        	issue_data id,
            issue_count ic
        """)

        if status != "active":
            # Query To Fetch Currently Resolved Complaints
            query = text("""
            WITH issue_data AS (
	            SELECT 
        	        issues.issue_date,
        	        issues.issue_no,
        	        issues.issue_title,
        	        issues.issue_content,
        	        issues.issue_status,
                    issues.issue_timestamp
        	    FROM issues
        	    WHERE issues.issue_status = false AND issues.email = :email
        	    ORDER BY issue_no DESC
                OFFSET :offset
                LIMIT :limit
            ),
            issue_count AS (
            	SELECT COUNT(issues.issue_no) as complaint_count
            	FROM issues
            	WHERE issues.issue_status = false AND issues.email = :email
            )
            SELECT 
            	id.*, 
                ic.*
            FROM
            	issue_data id,
                issue_count ic
            """)
        
        result = await db.execute(query, {"email": client_email, "offset": offset, "limit": limit})
        rows = result.fetchall()
        
        # result contains complaint data of specific client
        if rows:
            complaint_result_with_columns = [dict(row._mapping) for row in rows]
            return { "result": True,"data":complaint_result_with_columns }
        else:
            # No Complaints Found For This Client
            return { "result": False }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))