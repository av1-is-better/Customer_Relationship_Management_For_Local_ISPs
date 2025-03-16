from fastapi import FastAPI, Depends, Query, File, UploadFile, Form, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.get_db import get_db
from dependencies.verify_email import get_user_email
from dependencies.verify_admin import get_admin_email
from dependencies.get_auth0_management_token import get_auth0_management_token

import razorpay
import os
from dotenv import load_dotenv

from models.models import AccountSetupModel
from models.models import CreateUserModel
from models.models import UpdateUserModel
from models.models import GetProfileModel
from models.models import CreateTransactionModel
from models.models import UpdateTransactionModel
from models.models import DeleteTransactionModel
from models.models import ResolveComplaintModel
from models.models import DeleteComplaintModel
from models.models import GetClientSpecificComplaintModel
from models.models import CreateAnnouncementModel
from models.models import UpdateAnnouncementModel
from models.models import CreateTariffModel
from models.models import UpdateTariffModel
from models.models import CreateComplaintModel
from models.models import UpdateComplaintModel
from models.models import RazorPayOrderRequest
from models.models import PaymentVerificationRequest
from models.models import CreateReviewModel

from admin_routes.dashboard import dashboard
from admin_routes.get_transactions import get_transactions
from admin_routes.get_clients import get_clients
from admin_routes.setup_account import setup_account
from admin_routes.check_account import check_account
from admin_routes.create_client import make_new_client
from admin_routes.update_client import update_client
from admin_routes.client_profile import get_profile
from admin_routes.update_client_picture import update_picture
from admin_routes.reveal_pass import get_password
from admin_routes.delete_client import delete_client
from admin_routes.create_transaction import make_new_transaction
from admin_routes.update_transaction import update_transaction
from admin_routes.delete_transaction import delete_transaction
from admin_routes.get_complaints import get_complaints
from admin_routes.get_client_specific_complaints import get_client_specific_complaints
from admin_routes.resolve_complaint import resolve_complaint
from admin_routes.delete_complaint import delete_complaint
from admin_routes.invoice import get_invoice
from admin_routes.get_reviews import get_reviews
from admin_routes.get_logs import get_logs
from admin_routes.create_announcement import create_announcement
from admin_routes.get_announcements import get_announcements
from admin_routes.delete_announcement import delete_announcement
from admin_routes.update_announcement import update_announcement
from admin_routes.get_tariff_plans import get_tariff
from admin_routes.create_tariff_plan import create_tariff
from admin_routes.update_tariff_plan import update_tariff
from admin_routes.delete_tariff_plan import delete_tariff
from admin_routes.get_tariff_subscribers import get_subscribers
from admin_routes.get_tariff_migration_list import get_tariff_migration_list
from admin_routes.migrate_client_tariff import migrate_client_tariff

from client_routes.client_home import get_client_home
from client_routes.client_transactions import get_client_transactions
from client_routes.client_announcements import get_client_announcements
from client_routes.client_complaints import fetch_client_complaints
from client_routes.create_complaint import create_complaint
from client_routes.delete_complaint import delete_client_complaint
from client_routes.update_complaint import update_client_complaint
from client_routes.create_review import create_review

from razorpay_routes.create_order import create_order
from razorpay_routes.verify_order import verify_order

# Loading Environment Variables
load_dotenv()

# FASTAPI INSTANCE
app = FastAPI()
HTTP_BEARER = HTTPBearer()


# ░█████╗░░█████╗░██████╗░░██████╗
# ██╔══██╗██╔══██╗██╔══██╗██╔════╝
# ██║░░╚═╝██║░░██║██████╔╝╚█████╗░
# ██║░░██╗██║░░██║██╔══██╗░╚═══██╗
# ╚█████╔╝╚█████╔╝██║░░██║██████╔╝
# ░╚════╝░░╚════╝░╚═╝░░╚═╝╚═════╝░

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows specific origins
    allow_credentials=True,  # Allows cookies to be sent
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Configure the templates directory
invoice_template = Jinja2Templates(directory="invoice_template")

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(str(os.getenv("RAZORPAY_KEY_ID")), str(os.getenv("RAZORPAY_SECRET"))))


# ░█████╗░██╗░░██╗███████╗░█████╗░██╗░░██╗
# ██╔══██╗██║░░██║██╔════╝██╔══██╗██║░██╔╝
# ██║░░╚═╝███████║█████╗░░██║░░╚═╝█████═╝░
# ██║░░██╗██╔══██║██╔══╝░░██║░░██╗██╔═██╗░
# ╚█████╔╝██║░░██║███████╗╚█████╔╝██║░╚██╗
# ░╚════╝░╚═╝░░╚═╝╚══════╝░╚════╝░╚═╝░░╚═╝

# Route For Checking User Present in The Database and Returns User Type
@app.get("/check")
async def route(user_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    return await check_account(user_email,db)


# ░█████╗░██████╗░███╗░░░███╗██╗███╗░░██╗  ░██████╗███████╗████████╗██╗░░░██╗██████╗░
# ██╔══██╗██╔══██╗████╗░████║██║████╗░██║  ██╔════╝██╔════╝╚══██╔══╝██║░░░██║██╔══██╗
# ███████║██║░░██║██╔████╔██║██║██╔██╗██║  ╚█████╗░█████╗░░░░░██║░░░██║░░░██║██████╔╝
# ██╔══██║██║░░██║██║╚██╔╝██║██║██║╚████║  ░╚═══██╗██╔══╝░░░░░██║░░░██║░░░██║██╔═══╝░
# ██║░░██║██████╔╝██║░╚═╝░██║██║██║░╚███║  ██████╔╝███████╗░░░██║░░░╚██████╔╝██║░░░░░
# ╚═╝░░╚═╝╚═════╝░╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝  ╚═════╝░╚══════╝░░░╚═╝░░░░╚═════╝░╚═╝░░░░░

# Route For Creating User in Database
@app.post("/admin/setup-account")
async def route(user: AccountSetupModel, user_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await setup_account(user,user_email,db)


# ██╗░░██╗░█████╗░███╗░░░███╗███████╗
# ██║░░██║██╔══██╗████╗░████║██╔════╝
# ███████║██║░░██║██╔████╔██║█████╗░░
# ██╔══██║██║░░██║██║╚██╔╝██║██╔══╝░░
# ██║░░██║╚█████╔╝██║░╚═╝░██║███████╗
# ╚═╝░░╚═╝░╚════╝░╚═╝░░░░░╚═╝╚══════╝

# Route For Fetching Data For Home Dashboard
@app.get("/admin/dashboard")
async def route(user_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await dashboard(user_email,db)


# ████████╗██████╗░░█████╗░███╗░░██╗░██████╗░█████╗░░█████╗░████████╗██╗░█████╗░███╗░░██╗░██████╗
# ╚══██╔══╝██╔══██╗██╔══██╗████╗░██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║██╔════╝
# ░░░██║░░░██████╔╝███████║██╔██╗██║╚█████╗░███████║██║░░╚═╝░░░██║░░░██║██║░░██║██╔██╗██║╚█████╗░
# ░░░██║░░░██╔══██╗██╔══██║██║╚████║░╚═══██╗██╔══██║██║░░██╗░░░██║░░░██║██║░░██║██║╚████║░╚═══██╗
# ░░░██║░░░██║░░██║██║░░██║██║░╚███║██████╔╝██║░░██║╚█████╔╝░░░██║░░░██║╚█████╔╝██║░╚███║██████╔╝
# ░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝╚═════╝░

# ENDPOINT FOR READING ALL TRANSACTIONS
@app.get("/admin/transactions")
# Reads offset,limit from url_param (if not present then use default value of 0,10 respectively)  
async def route(offset: int = Query(0), limit: int = Query(10), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    is_admin = True
    return await get_transactions(admin_email,db,offset,limit,is_admin)

# ENDPOINT FOR READING SINGLE CLIENT'S TRANSACTIONS USING THEIR EMAIL
@app.post("/admin/client-transaction")
async def route(user_data: GetProfileModel,admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    email = user_data.model_dump()["email"]
    offset = 0 # No need for offset in this endpoint
    limit = 0 # No need for limit in this endpoint
    is_admin = False
    return await get_transactions(email,db,offset,limit,is_admin)

# ENDPOINT FOR CREATING TRANSACTIONS
@app.post("/admin/create-transaction")
async def route(transaction_data: CreateTransactionModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    transaction_data = transaction_data.model_dump()
    return await make_new_transaction(transaction_data,db)

# ENDPOINT FOR UPDATING TRANSACTIONS
@app.put("/admin/update-transaction")
async def route(transaction_data: UpdateTransactionModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    transaction_data = transaction_data.model_dump()
    return await update_transaction(transaction_data,db)

# ENDPOINT FOR DELETING TRANSACTIONS
@app.delete("/admin/delete-transaction")
async def route(transaction_data: DeleteTransactionModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    transaction_data = transaction_data.model_dump()
    return await delete_transaction(transaction_data,db)


# ░█████╗░██╗░░░░░██╗███████╗███╗░░██╗████████╗░██████╗
# ██╔══██╗██║░░░░░██║██╔════╝████╗░██║╚══██╔══╝██╔════╝
# ██║░░╚═╝██║░░░░░██║█████╗░░██╔██╗██║░░░██║░░░╚█████╗░
# ██║░░██╗██║░░░░░██║██╔══╝░░██║╚████║░░░██║░░░░╚═══██╗
# ╚█████╔╝███████╗██║███████╗██║░╚███║░░░██║░░░██████╔╝
# ░╚════╝░╚══════╝╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░╚═════╝░

# ENDPOINT FOR READING ALL CLIENTS
@app.get("/admin/clients")
async def route(admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_clients(db)

# ENDPOINT FOR FETCHING CLIENT'S PROFILE USING CLIENT'S EMAIL
@app.post("/admin/client-profile")
async def route(email: GetProfileModel,admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    email = email.model_dump()["email"]
    return await get_profile(email,db)

# ENDPOINT FOR CREATING NEW CLIENT
@app.post("/admin/create-client")
async def route(user_email: str = Depends(get_admin_email),db: AsyncSession = Depends(get_db),m2m_token: str = Depends(get_auth0_management_token),
    file: UploadFile = File(...),
    name: str = Form(...),
    gender: str = Form(...),
    country_code: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    id_type: str = Form(...),
    id_value: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    area_code: str = Form(...),
    plan_id: int = Form(...)
    ):
    # Create a user object from the form data
    new_client_data = CreateUserModel(
        name=name,
        gender=gender,
        country_code=country_code,
        phone=phone,
        email=email,
        password=password,
        id_type=id_type,
        id_value=id_value,
        address=address,
        city=city,
        area_code=area_code,
        plan_id = plan_id
    )

    return await make_new_client(new_client_data,file,m2m_token,db)

# ENDPOINT FOR UPDATING EXISTING CLIENT
@app.put("/admin/update-client")
async def route(update_client_data: UpdateUserModel, user_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db), m2m_token: str = Depends(get_auth0_management_token)):
    return await update_client(update_client_data,m2m_token,db)

# ENDPOINT FOR UPDATING CLIENT PICTURE
@app.put("/admin/update-client-picture")
async def route(file: UploadFile = File(...), email: str = Form(...), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    client_data = GetProfileModel(
        email=email
    )
    client_email = client_data.model_dump()["email"]
    return await update_picture(client_email,file,db)

# ENDPOINT FOR REVEALING USER PASSWORD
@app.post("/admin/reveal-client-password")
async def route(client_data: GetProfileModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    client_email = client_data.model_dump()["email"]
    return await get_password(client_email,db)

# ENDPOINT FOR DELETING CLIENT
@app.delete("/admin/delete-client")
async def route(client_data: GetProfileModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db),m2m_token: str = Depends(get_auth0_management_token)):
    client_email = client_data.model_dump()["email"]
    return await delete_client(client_email,m2m_token,db)


# ░█████╗░░█████╗░███╗░░░███╗██████╗░██╗░░░░░░█████╗░██╗███╗░░██╗████████╗░██████╗
# ██╔══██╗██╔══██╗████╗░████║██╔══██╗██║░░░░░██╔══██╗██║████╗░██║╚══██╔══╝██╔════╝
# ██║░░╚═╝██║░░██║██╔████╔██║██████╔╝██║░░░░░███████║██║██╔██╗██║░░░██║░░░╚█████╗░
# ██║░░██╗██║░░██║██║╚██╔╝██║██╔═══╝░██║░░░░░██╔══██║██║██║╚████║░░░██║░░░░╚═══██╗
# ╚█████╔╝╚█████╔╝██║░╚═╝░██║██║░░░░░███████╗██║░░██║██║██║░╚███║░░░██║░░░██████╔╝
# ░╚════╝░░╚════╝░╚═╝░░░░░╚═╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═╝╚═╝░░╚══╝░░░╚═╝░░░╚═════╝░

# READ ALL ACTIVE AND RESOLVED ISSUES OF CLIENTS
# YOU CAN PASS "issue_type" THROUGH URL PARAMS.
# BY DEFAULT, RETURNS ACTIVE COMPLAINTS WHEN NO PARAMS WERE PASSED.
@app.get("/admin/complaints")
async def route(status: str = Query("active"), offset: int = Query(0), limit: int = Query(10), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_complaints(status,offset,limit,db)

# Client Specific Complaint Route
@app.post("/admin/client-complaints")
async def route(data: GetClientSpecificComplaintModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    data = data.model_dump()
    client_email = data["client_email"]
    status = data["status"]
    return await get_client_specific_complaints(status,client_email,db)

# Updating The Status of Complaint
@app.put("/admin/complaints")
async def route(data: ResolveComplaintModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    request_body = data.model_dump()
    client_email = request_body["email"]
    status = request_body["issue_status"]
    issue_no = request_body["issue_no"]
    return await resolve_complaint(client_email,status,issue_no,db)

# Deleting Complaint
@app.delete("/admin/complaints")
async def route(data: DeleteComplaintModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    request_body = data.model_dump()
    client_email = request_body["email"]
    issue_no = request_body["issue_no"]
    return await delete_complaint(client_email,issue_no,db)


# ██╗███╗░░██╗██╗░░░██╗░█████╗░██╗░█████╗░███████╗
# ██║████╗░██║██║░░░██║██╔══██╗██║██╔══██╗██╔════╝
# ██║██╔██╗██║╚██╗░██╔╝██║░░██║██║██║░░╚═╝█████╗░░
# ██║██║╚████║░╚████╔╝░██║░░██║██║██║░░██╗██╔══╝░░
# ██║██║░╚███║░░╚██╔╝░░╚█████╔╝██║╚█████╔╝███████╗
# ╚═╝╚═╝░░╚══╝░░░╚═╝░░░░╚════╝░╚═╝░╚════╝░╚══════╝

# Invoice Route
@app.get("/invoice")
async def route(request: Request, db: AsyncSession = Depends(get_db), email: str = Depends(get_user_email),id: str = Query("id")):
    global invoice_template
    return await get_invoice(id,email,db,request,invoice_template)


# ██████╗░███████╗██╗░░░██╗██╗███████╗░██╗░░░░░░░██╗░██████╗
# ██╔══██╗██╔════╝██║░░░██║██║██╔════╝░██║░░██╗░░██║██╔════╝
# ██████╔╝█████╗░░╚██╗░██╔╝██║█████╗░░░╚██╗████╗██╔╝╚█████╗░
# ██╔══██╗██╔══╝░░░╚████╔╝░██║██╔══╝░░░░████╔═████║░░╚═══██╗
# ██║░░██║███████╗░░╚██╔╝░░██║███████╗░░╚██╔╝░╚██╔╝░██████╔╝
# ╚═╝░░╚═╝╚══════╝░░░╚═╝░░░╚═╝╚══════╝░░░╚═╝░░░╚═╝░░╚═════╝░

# ENDPOINT FOR READING REVIEWS
@app.get("/admin/reviews")
async def route(offset: int = Query(0), limit: int = Query(10),admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_reviews(admin_email,offset,limit,db,True)


# ██╗░░░░░░█████╗░░██████╗░░██████╗
# ██║░░░░░██╔══██╗██╔════╝░██╔════╝
# ██║░░░░░██║░░██║██║░░██╗░╚█████╗░
# ██║░░░░░██║░░██║██║░░╚██╗░╚═══██╗
# ███████╗╚█████╔╝╚██████╔╝██████╔╝
# ╚══════╝░╚════╝░░╚═════╝░╚═════╝░

# ENDPOINT FOR READING LOGS
@app.get("/admin/logs")
async def route(offset: int = Query(0), limit: int = Query(10),admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_logs(offset,limit,db)

# ENDPOINT FOR CREATING ANNOUNCEMENT
@app.post("/admin/announcements")
async def route(data: CreateAnnouncementModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    body = data.model_dump()
    return await create_announcement(body,db)


# ░█████╗░███╗░░██╗███╗░░██╗░█████╗░██╗░░░██╗███╗░░██╗░█████╗░███████╗███╗░░░███╗███████╗███╗░░██╗████████╗░██████╗
# ██╔══██╗████╗░██║████╗░██║██╔══██╗██║░░░██║████╗░██║██╔══██╗██╔════╝████╗░████║██╔════╝████╗░██║╚══██╔══╝██╔════╝
# ███████║██╔██╗██║██╔██╗██║██║░░██║██║░░░██║██╔██╗██║██║░░╚═╝█████╗░░██╔████╔██║█████╗░░██╔██╗██║░░░██║░░░╚█████╗░
# ██╔══██║██║╚████║██║╚████║██║░░██║██║░░░██║██║╚████║██║░░██╗██╔══╝░░██║╚██╔╝██║██╔══╝░░██║╚████║░░░██║░░░░╚═══██╗
# ██║░░██║██║░╚███║██║░╚███║╚█████╔╝╚██████╔╝██║░╚███║╚█████╔╝███████╗██║░╚═╝░██║███████╗██║░╚███║░░░██║░░░██████╔╝
# ╚═╝░░╚═╝╚═╝░░╚══╝╚═╝░░╚══╝░╚════╝░░╚═════╝░╚═╝░░╚══╝░╚════╝░╚══════╝╚═╝░░░░░╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░╚═════╝░

# ENDPOINT FOR READING ANNOUNCEMENTS
@app.get("/admin/announcements")
async def route(offset: int = Query(0), limit: int = Query(10),admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    is_admin = True
    return await get_announcements(offset,limit,db,is_admin)

# ENDPOINT FOR UPDATING ANNOUNCEMENT
@app.put("/admin/announcements")
async def route(data: UpdateAnnouncementModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    body = data.model_dump()
    return await update_announcement(body,db)

# ENDPOINT FOR DELETING ANNOUNCEMENT
@app.delete("/admin/announcements")
async def route(id: int = Query(0), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await delete_announcement(id,db)


# ████████╗░█████╗░██████╗░██╗███████╗███████╗  ██████╗░██╗░░░░░░█████╗░███╗░░██╗
# ╚══██╔══╝██╔══██╗██╔══██╗██║██╔════╝██╔════╝  ██╔══██╗██║░░░░░██╔══██╗████╗░██║
# ░░░██║░░░███████║██████╔╝██║█████╗░░█████╗░░  ██████╔╝██║░░░░░███████║██╔██╗██║
# ░░░██║░░░██╔══██║██╔══██╗██║██╔══╝░░██╔══╝░░  ██╔═══╝░██║░░░░░██╔══██║██║╚████║
# ░░░██║░░░██║░░██║██║░░██║██║██║░░░░░██║░░░░░  ██║░░░░░███████╗██║░░██║██║░╚███║
# ░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝╚═╝░░░░░╚═╝░░░░░  ╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝

# ENDPOINT FOR READING TARIFF PLANS
@app.get("/admin/tariff")
async def route(admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_tariff(db)

# ENDPOINT FOR READING TARIFF SUBSCRIBER LIST
@app.get("/admin/tariff-subscribers")
async def route(id: int = Query(0), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_subscribers(id,db)

# ENDPOINT FOR READING MIGRATE TARIFF LIST
@app.get("/admin/tariff-migration")
async def route(id: int = Query(0), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await get_tariff_migration_list(id,db)

# ENDPOINT FOR MIGRATING CLIENT TO ANOTHER TARIFF PLAN
@app.put("/admin/tariff-migration")
async def route(current: int = Query(0), target: int = Query(0), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    current_plan_id = current
    new_plan_id = target
    return await migrate_client_tariff(current_plan_id,new_plan_id,db)

# ENDPOINT FOR CREATING TARIFF PLAN
@app.post("/admin/tariff")
async def route(data: CreateTariffModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    body = data.model_dump()
    return await create_tariff(body,db)

# ENDPOINT FOR UPDATING TARIFF PLAN
@app.put("/admin/tariff")
async def route(data: UpdateTariffModel, admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    body = data.model_dump()
    return await update_tariff(body,db)

# ENDPOINT FOR DELETE TARIFF PLAN
@app.delete("/admin/tariff")
async def route(id: int = Query(0), admin_email: str = Depends(get_admin_email), db: AsyncSession = Depends(get_db)):
    return await delete_tariff(id,db)


# ░█████╗░██╗░░░░░██╗███████╗███╗░░██╗████████╗  ██████╗░░█████╗░██╗░░░██╗████████╗███████╗░██████╗
# ██╔══██╗██║░░░░░██║██╔════╝████╗░██║╚══██╔══╝  ██╔══██╗██╔══██╗██║░░░██║╚══██╔══╝██╔════╝██╔════╝
# ██║░░╚═╝██║░░░░░██║█████╗░░██╔██╗██║░░░██║░░░  ██████╔╝██║░░██║██║░░░██║░░░██║░░░█████╗░░╚█████╗░
# ██║░░██╗██║░░░░░██║██╔══╝░░██║╚████║░░░██║░░░  ██╔══██╗██║░░██║██║░░░██║░░░██║░░░██╔══╝░░░╚═══██╗
# ╚█████╔╝███████╗██║███████╗██║░╚███║░░░██║░░░  ██║░░██║╚█████╔╝╚██████╔╝░░░██║░░░███████╗██████╔╝
# ░╚════╝░╚══════╝╚═╝╚══════╝╚═╝░░╚══╝░░░╚═╝░░░  ╚═╝░░╚═╝░╚════╝░░╚═════╝░░░░╚═╝░░░╚══════╝╚═════╝░


# ENDPOINT FOR HOME SECTION OF CLIENT APP
@app.get("/client/home")
async def route(client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    return await get_client_home(client_email,db)

# ENDPOINT FOR INVOICES SECTION OF CLIENT APP
@app.get("/client/transactions")
async def route(client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db), offset: int = Query(0), limit: int = Query(10)):
    return await get_client_transactions(client_email,offset,limit,db)

# ENDPOINT FOR ANNOUNCEMENT SECTION OF CLIENT APP
@app.get("/client/announcements")
async def route(client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db), offset: int = Query(0), limit: int = Query(10)):
    return await get_client_announcements(offset,limit,db)

# ENDPOINT FOR COMPLAINT SECTION OF CLIENT APP
@app.get("/client/complaints")
async def route(client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db), offset: int = Query(0), limit: int = Query(10), status: str = Query("active")):
    return await fetch_client_complaints(status,limit,offset,client_email,db)

# ENDPOINT FOR CREATING COMPLAINT
@app.post("/client/complaints")
async def route(data: CreateComplaintModel, client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    body = data.model_dump()
    return await create_complaint(body,client_email,db)

# ENDPOINT FOR UPDATING COMPLAINT
@app.put("/client/complaints")
async def route(data: UpdateComplaintModel, client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    body = data.model_dump()
    return await update_client_complaint(body,client_email,db)

# ENDPOINT FOR DELETING COMPLAINT
@app.delete("/client/complaints")
async def route(issue_no: int = Query(0), client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    return await delete_client_complaint(issue_no,client_email,db)

# ENDPOINT FOR ACCEPTING CLIENT FEEDBACK
@app.post("/client/feedback")
async def route(body_data: CreateReviewModel, client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    body_data = body_data.model_dump()
    return await create_review(body_data,client_email,db)


# ██████╗░░█████╗░███████╗░█████╗░██████╗░██████╗░░█████╗░██╗░░░██╗
# ██╔══██╗██╔══██╗╚════██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗░██╔╝
# ██████╔╝███████║░░███╔═╝██║░░██║██████╔╝██████╔╝███████║░╚████╔╝░
# ██╔══██╗██╔══██║██╔══╝░░██║░░██║██╔══██╗██╔═══╝░██╔══██║░░╚██╔╝░░
# ██║░░██║██║░░██║███████╗╚█████╔╝██║░░██║██║░░░░░██║░░██║░░░██║░░░
# ╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝░╚════╝░╚═╝░░╚═╝╚═╝░░░░░╚═╝░░╚═╝░░░╚═╝░░░

# ENDPOINT FOR CREATING ORDER
@app.post("/payment/create-order")
async def route(body_data: RazorPayOrderRequest, client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    amount = body_data.model_dump()["amount"]
    return await create_order(amount,razorpay_client,db)

# ENDPOINT FOR VERIFYING PAYMENT
@app.post("/payment/verify-order")
async def route(body_data: PaymentVerificationRequest, client_email: str = Depends(get_user_email), db: AsyncSession = Depends(get_db)):
    body_data = body_data.model_dump()
    return await verify_order(body_data,razorpay_client,client_email,db)