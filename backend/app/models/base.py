from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones vinculadas correctamente para evitar errores de Mapper
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    items = relationship("Item", back_populates="tenant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="tenant", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    phone = Column(String, nullable=True)
    tenant = relationship("Tenant", back_populates="users")

class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    is_service = Column(Boolean, default=False) 
    stock = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    tenant = relationship("Tenant", back_populates="items")

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    address = Column(Text, nullable=True) 
    appointment_datetime = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="pending") 
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="orders")

class Post(Base):
    __tablename__ = "posts"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    image_url = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="posts")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")

class Like(Base):
    __tablename__ = "likes"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String, ForeignKey("posts.id"), nullable=False)
    client_identifier = Column(String, nullable=False, index=True)
    
    post = relationship("Post", back_populates="likes")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), unique=True, nullable=False)
    balance = Column(Float, default=0.0)
    
    tenant = relationship("Tenant", back_populates="wallet")