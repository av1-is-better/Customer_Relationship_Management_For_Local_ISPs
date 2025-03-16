from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/complaints)
async def get_client_specific_complaints(status,client_email,db):
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
        	WHERE issues.issue_status = true AND issues.email = :email
        	ORDER BY issue_no DESC
            LIMIT 100
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
	            users.email,
	            users.name,
	            users.phone,
	            issues.issue_date,
	            issues.issue_no,
	            issues.issue_title,
	            issues.issue_content,
	            issues.issue_status
	            FROM issues JOIN users ON users.email = issues.email
	            WHERE issues.issue_status = false AND issues.email = :email
	            ORDER BY issue_no DESC
                LIMIT 100
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
        result = await db.execute(query, {"email": client_email})
        rows = result.fetchall()
        
        # result contains complaint data of specific client
        if rows:
            complaint_result_with_columns = [dict(row._mapping) for row in rows]
            
            # Fetching Client Profile
            client_profile_query = text("""
                    SELECT *
                    FROM users
                    JOIN tariff_plans ON users.plan_id = tariff_plans.plan_id
                    WHERE users.email = :email
                    """)

            client_result = await db.execute(client_profile_query,{"email":client_email})
            client_rows = client_result.fetchall()
            
            # result contains client profile data
            if client_rows:
                client_result_with_columns = [dict(row._mapping) for row in client_rows]
                # Convert the image (BYTEA) to base64
                base_64_picture = base64.b64encode(client_result_with_columns[0]['picture']).decode('utf-8')
                client_result_with_columns[0]["picture"] = base_64_picture
                return {"result": True,"complaint_data":complaint_result_with_columns,"client_profile":client_result_with_columns[0]}
        else:
            # No Complaints Found For This Client
            # Fetching Client Profile
            client_profile_query = text("""
                SELECT *
                FROM users
                JOIN tariff_plans ON users.plan_id = tariff_plans.plan_id
                WHERE users.email = :email
                """)

            client_result = await db.execute(client_profile_query,{"email":client_email})
            client_rows = client_result.fetchall()

            # result contains client profile data
            if client_rows:
                client_result_with_columns = [dict(row._mapping) for row in client_rows]
                # Convert the image (BYTEA) to base64
                base_64_picture = base64.b64encode(client_result_with_columns[0]['picture']).decode('utf-8')
                client_result_with_columns[0]["picture"] = base_64_picture
                return {"result": False, "client_profile":client_result_with_columns[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))