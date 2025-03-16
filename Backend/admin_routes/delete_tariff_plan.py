from sqlalchemy import text
from fastapi import HTTPException
import base64

# DELETE (/admin/tariff)
async def delete_tariff(plan_id,db):
    try:
        
        if plan_id == 0:
            return {
                    "result": False,
                    "message":"Please provide 'id' url parameter."
                    }
        
        # Check Query To Make Sure This Plan is Not Subscribed By Any Client Before Deleting.
        check_query = text("""
                           SELECT * FROM users WHERE plan_id = :plan_id
                           """)
        # Executing Check Query
        check_result = await db.execute(check_query,{"plan_id":plan_id})
        check_rows = check_result.fetchall()
        # Plan is Currently Subscribed
        if check_rows:
            # Returning False Response
            return {
                    "result": False,
                    "message":"Failed!, Tariff Plan with active subscribers cannot be deleted :("
                    }
            
        # Plan Not Subscribed
        else:
            # This is Delete Query For Tariff Plan
            query = text("""
            DELETE FROM tariff_plans
            WHERE plan_id = :plan_id
            """)
            
            # Executing Delete Query
            await db.execute(query,{"plan_id":plan_id})
            
            # Commiting Database Changes
            await db.commit()
            
            # Returning True Response
            return {
                    "result": True,
                    "message":"Tariff Plan Deleted :)"
                    }
            
        
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))