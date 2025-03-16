from sqlalchemy import text
from fastapi import HTTPException
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# (/update-client)
async def update_client(update_client_data,m2m_token,db):
    # Converting to Dictionary
    update_client_data = update_client_data.model_dump()

    # email of client that needs to be updated
    client_email = update_client_data["email"]

    # key_param is the column in database That Needs To Be Updated (name,phone,password,internet_plan,address,city,area_code,id_type)
    column = update_client_data["key"]
    
    # given_value is Used To Update The Provided Parameter
    value = update_client_data["value"]
    
    try:
        # Checking If User is Already Present in Database or Not
        check_query = text("SELECT * FROM users WHERE email = :email")
        result = await db.execute(check_query, {"email": client_email})
        rows = result.fetchall()
        if rows:
            pass
        else:
            return {"result": False,"reason":"No Such Client Found."}
        
        # UPDATING IDENTITY VERIFICATION DOCUMENT
        if column == "id_type":
            value = value.split(',')
            if len(value) > 2:
                raise HTTPException(status_code=400, detail=str("value must include both (id_type,id_value) as single string in following format. 'Aadhar Card,1234567890'"))
            id_type = value[0]
            id_value = value[1]
            db_query = text("UPDATE users SET id_type=:idType, id_value=:idValue WHERE users.email = :userEmail")
            await db.execute(db_query, {"idType":id_type.upper(),"idValue":id_value.upper(),"userEmail":client_email})
            await db.commit()
            return {"result": True,"message":"Client's Identity Document Updated Successfully :)"}
        
        # UPDATING NAME
        elif column == "name":
            new_name = value
            db_query = text("UPDATE users SET name=:newName WHERE users.email = :userEmail")
            await db.execute(db_query, {"newName":new_name.upper(),"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"Client's Name Updated Successfully :)"}
        
        # UPDATING GENDER
        elif column == "gender":
            new_gender = value
            db_query = text("UPDATE users SET gender=:newGender WHERE users.email = :userEmail")
            await db.execute(db_query, {"newGender":new_gender.upper(),"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"Client's Gender Updated Successfully :)"}
        
        # UPDATING PHONE
        elif column == "phone":
            new_phone = value
            db_query = text("UPDATE users SET phone=:newPhone WHERE users.email = :userEmail")
            await db.execute(db_query, {"newPhone":new_phone,"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"User's Phone Updated Successfully :)"}
        
        # UPDATING ADDRESS
        elif column == "address":
            new_address = value
            db_query = text("UPDATE users SET address=:newAddress WHERE users.email = :userEmail")
            await db.execute(db_query, {"newAddress":new_address.upper(),"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"Client's Address Updated Successfully :)"}
        
        # UPDATING CITY
        elif column == "city":
            new_city = value
            db_query = text("UPDATE users SET city=:newCity WHERE users.email = :userEmail")
            await db.execute(db_query, {"newCity":new_city.upper(),"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"Client's City Updated Successfully :)"}
        
        # UPDATING AREA CODE
        elif column == "area_code":
            new_area_code = value
            db_query = text("UPDATE users SET area_code=:newAreaCode WHERE users.email = :userEmail")
            await db.execute(db_query, {"newAreaCode":new_area_code,"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"Client's Area Code Updated Successfully :)"}
        
        # UPDATING TARIFF PLAN
        elif column == "plan_id":
            new_plan_id = int(value)
            db_query = text("UPDATE users SET plan_id=:newPlanID WHERE users.email = :userEmail")
            await db.execute(db_query, {"newPlanID":new_plan_id,"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"User's Tariff Plan Updated Successfully :)"}
    
        # UPDATING CLIENT LOGIN PASSWORD
        elif column == "password":
            new_password = value
            user_id = ""

            # First We Need Client's UserID Issued By AUTH0 (WE NEED TO CALL THEIR API)
            url = f"https://{str(os.getenv("AUTH0_DOMAIN"))}/api/v2/users-by-email"
            headers = {
                "Authorization": f"Bearer {m2m_token}",
                "content-type": "application/json"}
            params = {"email": client_email}
    
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            users = response.json()
            if users:
                user_id = users[0]["user_id"]
            else:
                raise HTTPException(status_code=400, detail=str(e))

            # Now We Have The UserID Let's Make Another API Call To Change User Password
            url = f"https://{str(os.getenv("AUTH0_DOMAIN"))}/api/v2/users/{user_id}"
            headers = {
                "Authorization": f"Bearer {m2m_token}",
                "content-type": "application/json"
            }
            data = {
                "password": new_password,
                "connection": "Username-Password-Authentication"
            }

            response = requests.patch(url, headers=headers, json=data)
            response.raise_for_status()

            # Finally Update The Password in Our Database
            db_query = text("UPDATE passwords SET password=:newPassword WHERE passwords.email = :userEmail")
            await db.execute(db_query, {"newPassword":new_password,"userEmail":client_email})
            await db.commit()
            return {"result": True, "message":"User's Password Changed Successfully :)"}

    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))