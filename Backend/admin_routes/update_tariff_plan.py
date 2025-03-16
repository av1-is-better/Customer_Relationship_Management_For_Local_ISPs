from sqlalchemy import text
from fastapi import HTTPException
import base64

# PUT (/admin/tariff)
async def update_tariff(data,db):
    try:
        # Check Query To Confirm Plan Exist Before Updating
        check_query = text("""
                           SELECT * FROM tariff_plans WHERE plan_id = :plan_id
                           """)
        # Executing Check Query
        check_result = await db.execute(check_query,{"plan_id":data["plan_id"]})
        check_rows = check_result.fetchall()
        # Plan Does Exist
        if check_rows:
            # This is Update Query For Tariff Plan
            query = text("""
            UPDATE tariff_plans
            SET plan_name = :plan_name,
                plan_speed = :plan_speed,
                speed_unit = :speed_unit,
                plan_validity = :plan_validity,
                validity_unit = :validity_unit,
                plan_cost = :plan_cost
            WHERE plan_id = :plan_id
            """)
            
            # Executing Update Query
            await db.execute(query,{
                "plan_id":data["plan_id"],
                "plan_name":data["plan_name"],
                "plan_speed":data["plan_speed"],
                "speed_unit":data["speed_unit"],
                "plan_validity":data["plan_validity"],
                "validity_unit":data["validity_unit"],
                "plan_cost":data["plan_cost"]
            })
            
            # Commiting Database Changes
            await db.commit()
            
            # Returning True Response
            return {
                    "result": True,
                    "message":"Tariff Plan Updated :)"
                    }
        # Plan Not Exist
        else:
            # Returning False Response
            return {
                    "result": False,
                    "message":"Failed!, The Tariff Plan you're trying to update doesn't exist :("
                    }
        
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))