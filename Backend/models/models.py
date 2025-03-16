from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Literal
import re

# Account Setup Model
class AccountSetupModel(BaseModel):
    name: str = Field(..., pattern=r'^[A-Za-z\s]+$', description="Only letters and spaces allowed")
    phone: str = Field(..., pattern=r'^\d{10}$', description="Exactly 10 digits allowed")

# Create New User Model
class CreateUserModel(BaseModel):
    name: str = Field(..., pattern=r'^[A-Za-z\s]+$', description="Only letters and spaces allowed")
    gender: str
    country_code: str
    phone: str = Field(..., pattern=r'^\d{10}$', description="Exactly 10 digits allowed")
    email: EmailStr
    password: str = Field(..., min_length=8)
    id_type: str
    id_value: str
    address: str
    city: str
    area_code: str
    plan_id: int

    @field_validator('password')
    def validate_password(cls, value):
        if not any(char.islower() for char in value):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(char.isupper() for char in value):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.isdigit() for char in value):
            raise ValueError('Password must contain at least one digit')
        if not any(char in '!@#$%^&*()-_+=<>?/|\\' for char in value):
            raise ValueError('Password must contain at least one special character')
        return value

# Update Existing User
class UpdateUserModel(BaseModel):
    email: EmailStr
    key: Literal['name', 'gender', 'phone', 'password', 'address', 'city', 'area_code', 'id_type', 'plan_id']
    value: str

    @field_validator('value', mode='before')
    def validate_value(cls, v, info):
        key = info.data['key']

        if key == 'name':
             # Allow alphabetic characters and spaces
            if not re.fullmatch(r'[A-Za-z ]+', v):
                raise ValueError('Name must contain only alphabetic characters and spaces')

        elif key == 'phone':
            if not re.fullmatch(r'\d{10}', v[4:]):
                raise ValueError('Phone number must contain exactly 10 digits')

        elif key == 'password':
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters long')
            if not re.search(r'[a-z]', v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not re.search(r'[A-Z]', v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not re.search(r'[0-9]', v):
                raise ValueError('Password must contain at least one digit')
            if not re.search(r'[\W_]', v):
                raise ValueError('Password must contain at least one special character')
        
        elif key == 'id_type':
            if ',' not in v:
                raise ValueError('Value Must Include id_type and id_value in single string seperated by (,) comma')

        return v


class GetProfileModel(BaseModel):
    email: EmailStr

class CreateTransactionModel(BaseModel):
    email: EmailStr
    mode: str
    amount: int
    date: str

class UpdateTransactionModel(BaseModel):
    mode: str
    amount: int
    date: str
    id: str

class DeleteTransactionModel(BaseModel):
    id: str

class ResolveComplaintModel(BaseModel):
    email: EmailStr
    issue_no: int
    issue_status: bool

class DeleteComplaintModel(BaseModel):
    email: EmailStr
    issue_no: int

class GetClientSpecificComplaintModel(BaseModel):
    client_email: EmailStr
    status: str

class CreateAnnouncementModel(BaseModel):
    title: str
    message: str

class UpdateAnnouncementModel(BaseModel):
    id: int
    title: str
    message: str


class CreateTariffModel(BaseModel):
    plan_name: str
    plan_speed: int
    speed_unit: str
    plan_validity: int
    validity_unit: str
    plan_cost: int

class UpdateTariffModel(BaseModel):
    plan_id: int
    plan_name: str
    plan_speed: int
    speed_unit: str
    plan_validity: int
    validity_unit: str
    plan_cost: int
    
class CreateComplaintModel(BaseModel):
    subject: str
    complaint: str
    
class UpdateComplaintModel(BaseModel):
    issue_no: int
    subject: str
    complaint: str

class RazorPayOrderRequest(BaseModel):
    amount: int  # Amount in paise (1 INR = 100 paise)

class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount: int # Amount in paise (1 INR = 100 paise)
    transaction_id: str

class CreateReviewModel(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    feedback: str

class Config:
    use_enum_values = True    