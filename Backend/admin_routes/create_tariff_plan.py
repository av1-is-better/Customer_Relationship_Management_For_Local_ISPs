from sqlalchemy import text
from fastapi import HTTPException
import base64

# (/admin/tariff)
async def create_tariff(data,db):
    try:
        # Check Query To See Whether there is plan_name conflict
        check_query = text("""
                           SELECT * FROM tariff_plans WHERE plan_name = :plan_name
                           """)
        # Executing Check Query
        check_result = await db.execute(check_query,{"plan_name":data["plan_name"]})
        check_rows = check_result.fetchall()
        if check_rows:
            return {
                    "result":False,
                    "message":"Plan Name conflict detected, Please use unique name."
                    }
        else:
            # This is Insert Query For Tariff Plan
            query = text("""
            INSERT INTO tariff_plans(plan_name, plan_speed, speed_unit, plan_validity, validity_unit, plan_cost)
            VALUES(:plan_name, :plan_speed, :speed_unit, :plan_validity, :validity_unit, :plan_cost)
            """)
            
            # Executing Insert Query Query
            await db.execute(query,{
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
                    "message":"New Tariff Plan Created :)"
                    }
        
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))