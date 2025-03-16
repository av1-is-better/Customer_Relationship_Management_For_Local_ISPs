from sqlalchemy import text
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from num2words import num2words

load_dotenv()

async def calculate_tax(amount: int) -> dict:
    tax_rate = 0.09  # 9% SGST and 9% CGST
    subtotal = amount / (1 + 2 * tax_rate)
    sgst = subtotal * tax_rate
    cgst = subtotal * tax_rate
    total = subtotal + sgst + cgst

    return {
        'subtotal': round(subtotal, 2),
        'sgst': round(sgst, 2),
        'cgst': round(cgst, 2),
        'total': round(total, 2)
    }

async def amount_to_inr_words(amount):
    in_words = num2words(amount, to='currency', lang='en_IN').replace('euro', 'rupees').replace('cents', '').split(',')
    return in_words[0].upper()

# (/invoice)
async def get_invoice(transaction_id,email,db,request,invoice_template):
    try:
        ADMIN_EMAILS = os.getenv("ADMIN_EMAILS").split(',')

        # Query For Clients Where They Can Only View Their Invoices Using ID and Email
        query = text("""
            SELECT 
                    users.name, 
                    users.phone, 
                    users.email, 
                    transactions.invoice, 
                    transactions.id, 
                    transactions.date, 
                    transactions.mode, 
                    transactions.amount
                FROM users
                JOIN transactions ON users.email = transactions.email
                WHERE transactions.id = :id AND transactions.email = :email
            """)
        
        # Admin Can Access Any Invoice Using ID
        if email in ADMIN_EMAILS:
            query = text("""
                SELECT 
                    users.name, 
                    users.phone, 
                    users.email, 
                    transactions.invoice, 
                    transactions.id, 
                    transactions.date, 
                    transactions.mode, 
                    transactions.amount
                FROM users
                JOIN transactions ON users.email = transactions.email
                WHERE id = :id
            """)

        result = await db.execute(query, {"email": email, "id": transaction_id})
        rows = result.fetchall()
        
        if rows:
            transaction_data = [dict(row._mapping) for row in rows][0]
            tax_data = await calculate_tax(transaction_data["amount"])
            words = await amount_to_inr_words(transaction_data["amount"]*100)
            return invoice_template.TemplateResponse("index.html", {"request": request, 
                                                             "date": transaction_data["date"], 
                                                             "id":transaction_data["id"],
                                                             "invoice_no":transaction_data["invoice"],
                                                             "name":transaction_data["name"],
                                                             "phone":transaction_data["phone"],
                                                             "mode":transaction_data["mode"],
                                                             "total":transaction_data["amount"],
                                                             "subtotal":tax_data["subtotal"],
                                                             "sgst":tax_data["sgst"],
                                                             "cgst":tax_data["cgst"],
                                                             "words":words}
                                            )
        else:
            raise HTTPException(status_code=400, detail=str(e))
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))