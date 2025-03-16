from sqlalchemy import text
from fastapi import HTTPException

# (/admin/complaints)
async def get_complaints(status,offset,limit,db):
    try:
        # Query To Fetch Currently Active Complaints
        query = text("""
        WITH issue_data AS (
        	SELECT 
        	users.email,
        	users.name,
        	users.phone,
        	issues.issue_date,
        	issues.issue_no,
        	issues.issue_title,
        	issues.issue_content,
        	issues.issue_status
        	FROM issues JOIN users ON users.email = issues.email
        	WHERE issues.issue_status = true
        	ORDER BY issue_no DESC
            LIMIT :limit
            OFFSET :offset
        ),
        issue_count AS (
        	SELECT COUNT(issues.issue_no) as complaint_count
        	FROM issues
        	WHERE issues.issue_status = true
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
	            users.email,
	            users.name,
	            users.phone,
	            issues.issue_date,
	            issues.issue_no,
	            issues.issue_title,
	            issues.issue_content,
	            issues.issue_status
	            FROM issues JOIN users ON users.email = issues.email
	            WHERE issues.issue_status = false
	            ORDER BY issue_no DESC
	            LIMIT :limit
                OFFSET :offset
            ),
            issue_count AS (
            	SELECT COUNT(issues.issue_no) as complaint_count
            	FROM issues
            	WHERE issues.issue_status = false
            )
            SELECT 
            	id.*, 
                ic.*
            FROM
            	issue_data id,
                issue_count ic
            """)
        result = await db.execute(query, {"limit": limit, "offset":offset})
        rows = result.fetchall()
        # result contains data
        if rows:
            result_with_columns = [dict(row._mapping) for row in rows]
            return {"result": True,"data":result_with_columns}
        # result is empty
        return {"result": False}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))