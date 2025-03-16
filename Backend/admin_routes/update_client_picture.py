from sqlalchemy import text
from fastapi import HTTPException
from PIL import Image
import io

# (/update-client-picture)
async def update_picture(client_email, file, db):
    # Validate and resize the uploaded image
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    image = Image.open(io.BytesIO(await file.read()))
    aspect_ratio = image.height / image.width
    new_width = 300
    new_height = int(new_width * aspect_ratio)
    resized_image = image.resize((new_width, new_height))

    # Convert resized image to bytes
    img_byte_arr = io.BytesIO()
    resized_image.save(img_byte_arr, format=image.format)
    img_byte_arr = img_byte_arr.getvalue()
    client_photo = img_byte_arr
    
    try:
        # Checking If User is Already Present in Database or Not
        check_query = text("SELECT email FROM users WHERE email = :email")
        result = await db.execute(check_query, {"email": client_email})
        rows = result.fetchall()
        if rows:
            pass
        else:
            return {"result": False,"reason":"No Such Client Found."}
        
        update_query = text("""UPDATE users
                            SET picture = :picture
                            WHERE email = :email""")
        await db.execute(update_query, {"picture":client_photo,"email": client_email})
        await db.commit()
        return {"result": True, "message":"Client's Picture Updated Successfully :)"}

    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))