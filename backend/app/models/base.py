from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Boolean, Integer, ARRAY
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

# --- NÚCLEO DEL SISTEMA (Multi-tenant) ---

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    primary_color = Column(String, default="#ffffff")
    secundary_color = Column(String, default="#000000")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    appointment_interval = Column(Integer, default=30)

    # Relaciones
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    items = relationship("Item", back_populates="tenant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="tenant", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="tenant", cascade="all, delete-orphan")
    wallet_transactions = relationship("WalletTransaction", back_populates="tenant")
    business_hours = relationship("BusinessHour", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    phone = Column(String, nullable=True)
    is_superuser = Column(Boolean, default=False)
    tenant = relationship("Tenant", back_populates="users")

# --- PRODUCTOS, VARIANTES Y EXTRAS ---

class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)  # Precio base o inicial
    image_url = Column(String, nullable=True)
    is_service = Column(Boolean, default=False) 
    stock = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    additional_images = Column(ARRAY(String), default=[])
    
    tenant = relationship("Tenant", back_populates="items")
    variants = relationship("ItemVariant", back_populates="item", cascade="all, delete-orphan")
    extras = relationship("ItemExtra", back_populates="item", cascade="all, delete-orphan")

class ItemVariant(Base):
    __tablename__ = "item_variants"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String, ForeignKey("items.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    item = relationship("Item", back_populates="variants")

class ItemExtra(Base):
    __tablename__ = "item_extras"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String, ForeignKey("items.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    item = relationship("Item", back_populates="extras")

# --- PEDIDOS Y FACTURACIÓN ---

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
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    """Detalle de cada producto dentro de una orden"""
    __tablename__ = "order_items"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    item_id = Column(String, ForeignKey("items.id"), nullable=True)
    
    item_name = Column(String, nullable=False) 
    variant_name = Column(String, nullable=True) 
    extras_summary = Column(Text, nullable=True) # Ej: "Extra Queso, Sin Cebolla"
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False) # Precio de la variante elegida
    extras_total_price = Column(Float, default=0.0) # Suma de todos los extras
    total_line_price = Column(Float, nullable=False) # (unit_price + extras_total_price) * quantity

    order = relationship("Order", back_populates="order_items")

# --- RED SOCIAL Y FIDELIZACIÓN ---

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

# --- SISTEMA DE CRÉDITOS (SaaS Monetization) ---

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), unique=True, nullable=False)
    balance = Column(Float, default=0.0)
    plan_type = Column(String, default="PAY_AS_YOU_GO") # "SUBSCRIPTION" para los aclientados
    subscription_end = Column(DateTime, nullable=True)
    
    tenant = relationship("Tenant", back_populates="wallet")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id"))
    amount = Column(Integer)  # Puede ser positivo (+10) o negativo (-1)
    previous_balance = Column(Integer)
    new_balance = Column(Integer)
    reason = Column(String)  # Ej: "Recarga mensual", "Pedido #123", "Corrección"
    created_at = Column(DateTime, default=func.now())

    # Relación para consultas fáciles
    tenant = relationship("Tenant", back_populates="wallet_transactions")  

class BusinessHour(Base):
    __tablename__ = "business_hours"
    
    id = Column(Integer, primary_key=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    # Cambiamos Time por String aquí:
    open_time = Column(String, nullable=False) 
    close_time = Column(String, nullable=False)
    is_closed = Column(Boolean, default=False)
    tenant = relationship("Tenant", back_populates="business_hours")