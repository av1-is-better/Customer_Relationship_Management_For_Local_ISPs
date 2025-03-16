from sqlalchemy import text
from fastapi import HTTPException
import base64

# PUT (/admin/tariff)
async def migrate_client_tariff(current_plan_id,new_plan_id,db):
    try:
        if current_plan_id == new_plan_id:
            raise HTTPException(status_code=400, detail=str("duplicate current_plan_id and target_plan_id"))
        # Check Query To Confirm Plan Exist Before Updating
        check_plan_query = text("""
                           SELECT plan_id FROM tariff_plans WHERE plan_id = :plan_id
                           """)
        # Checking Current Tariff Plan Exists
        check_current_plan_result = await db.execute(check_plan_query,{"plan_id":current_plan_id})
        current_plan_rows = check_current_plan_result.fetchall()
        if current_plan_rows: # Current Plan Exists
            # Checking Target Tariff Plan Exists
            check_new_plan_result = await db.execute(check_plan_query,{"plan_id":new_plan_id})
            new_plan_rows = check_new_plan_result.fetchall()
            if new_plan_rows: # Target Plan Exists
                # This Query Changes Users Plan From Current plan_id To Target plan_id
                query = text("""
                UPDATE users
                SET plan_id = :new_plan_id
                WHERE plan_id = :current_plan_id
                """)
            
                # Executing Update Query
                await db.execute(query,{"current_plan_id":current_plan_id,"new_plan_id":new_plan_id})
            
                # Commiting Database Changes
                await db.commit()
            
                # Returning True Response
                return {
                    "result": True,
                    "message":"You've successfully migrated clients to another plan :)"
                }
            # Target Plan Not Exist
            else:
                # Returning False Response
                return {
                    "result": False,
                    "message":"Failed!, The Tariff Plan you're trying to migrate to doesn't exist :("
                    }
        # Current Plan Not Exist
        else:
            # Returning False Response
            return {
                    "result": False,
                    "message":"Failed!, The Tariff Plan you're trying to migrate from doesn't exist :("
                    }
        
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))