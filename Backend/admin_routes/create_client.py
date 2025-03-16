from sqlalchemy import text
from fastapi import HTTPException
import requests
import os
from PIL import Image
import io
from encryption_handler.encryption_handler import encode_string
from dotenv import load_dotenv

load_dotenv()

# (/admin/create-client)
async def make_new_client(client_data, file, m2m_token, db):
    # Validate and resize the uploaded image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type, expected an image")

    # Read the image from file
    image = Image.open(io.BytesIO(await file.read()))

    # Convert image to RGB if it's in a different mode (e.g., PNG with transparency)
    if image.mode in ("RGBA", "LA"):
        image = image.convert("RGB")

    # Resize the image while maintaining aspect ratio
    aspect_ratio = image.height / image.width
    new_width = 300
    new_height = int(new_width * aspect_ratio)
    resized_image = image.resize((new_width, new_height))

    # Convert resized image to JPEG bytes
    img_byte_arr = io.BytesIO()
    resized_image.save(img_byte_arr, format="JPEG")
    img_byte_arr = img_byte_arr.getvalue()

    client_name = client_data.model_dump()["name"].upper()
    client_gender = client_data.model_dump()["gender"].upper()
    client_phone = client_data.model_dump()["country_code"]+"-"+str(client_data.model_dump()["phone"])
    client_email = client_data.model_dump()["email"]
    client_password = encode_string(client_data.model_dump()["password"],os.getenv("PASSWORD_ENCRYPTION_KEY"))
    client_id_type = client_data.model_dump()["id_type"].upper()
    client_id_value = client_data.model_dump()["id_value"].upper()
    client_address = client_data.model_dump()["address"].upper()
    client_city = client_data.model_dump()["city"].upper()
    client_area_code = client_data.model_dump()["area_code"]
    client_plan_id = client_data.model_dump()["plan_id"]
    client_photo = img_byte_arr
    
    try:
        # Checking If User is Already Present in Database or Not
        check_query = text("SELECT email FROM users WHERE email = :email")
        result = await db.execute(check_query, {"email": client_email})
        rows = result.fetchall()
        if rows:
            return {"result": False,"reason":"email_conflict"}
        
        # Calling Auth0 API For Creating New User Login in Their Database
        url = f"https://{str(os.getenv("AUTH0_DOMAIN"))}/api/v2/users"
        headers = {
            "Authorization": f"Bearer {m2m_token}",
            "content-type": "application/json"
        }
        data = {
            "name": client_name,
            "email": client_email,
            "password": client_data.model_dump()["password"],
            "connection": "Username-Password-Authentication"
        }

        # AUTH API CALL FOR CREATING NEW USER
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        user_id = response.json()["identities"][0]["user_id"]

        # FOR TESTING PURPOSE (SKIP AUTH0 USER CREATION)
        # user_id = 'TEST-USER'


        # Parameterized query using :email as a placeholder
        insert_user_query = text("""
                     INSERT INTO users(name, gender, phone, email, address, city, area_code, id_type, id_value, user_id, picture, plan_id) 
                     VALUES(:name, :gender, :phone, :email, :address, :city, :areaCode, :idType, :idValue, :userId, :picture, :plan_id)
                     """)
        
        insert_password_query = text("""
                     INSERT INTO passwords(email, password) 
                     VALUES(:email, :password)
                     """)

        await db.execute(insert_user_query, {
            "name": client_name,
            "gender": client_gender,
            "phone": client_phone,
            "email": client_email,
            "address": client_address,
            "city": client_city,
            "areaCode": client_area_code,
            "idType": client_id_type,
            "idValue": client_id_value,
            "userId": user_id,
            "picture": client_photo,
            "plan_id": client_plan_id
        })

        await db.execute(insert_password_query, {
            "email": client_email,
            "password": client_password
        })

        await db.commit()

        return {"result": True}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))