from pydantic import BaseModel, EmailStr

class BusinessRegister(BaseModel):
    email: EmailStr
    password: str
    business_name: str
    slug: str
    phone: str