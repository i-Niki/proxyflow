# main.py
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
import bcrypt
import secrets
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Enum, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import redis
import enum

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Database setup
DATABASE_URL = "postgresql://proxyuser:proxypass123@postgres:5432/proxyflow"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

# FastAPI app
app = FastAPI(title="ProxyFlow API", version="1.0.0")

# NOTE: Tables are now managed by Django migrations
# Do NOT create tables here - they are created by Django
# Base.metadata.create_all(bind=engine) - REMOVED

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Enums
class ProxyType(str, enum.Enum):
    RESIDENTIAL = "residential"
    DATACENTER = "datacenter"
    MOBILE = "mobile"
    ISP = "isp"

class PlanType(str, enum.Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    api_key = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    usage_logs = relationship("UsageLog", back_populates="user")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    plan = Column(Enum(PlanType), nullable=False)
    
    # Data limits (for future Proxy Gateway - when traffic goes through us)
    data_limit_gb = Column(Float, nullable=False)
    data_used_gb = Column(Float, default=0.0)
    
    # Proxy request limits (current MVP implementation)
    proxy_requests_limit = Column(Integer, default=1000)
    proxy_requests_used = Column(Integer, default=0)
    
    concurrent_connections = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="subscription")

class ProxyPool(Base):
    __tablename__ = "proxy_pools"
    
    id = Column(Integer, primary_key=True, index=True)
    proxy_type = Column(Enum(ProxyType), nullable=False)
    ip_address = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    country = Column(String)
    city = Column(String)
    is_active = Column(Boolean, default=True)
    last_used = Column(DateTime)
    success_rate = Column(Float, default=100.0)

class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    proxy_id = Column(Integer, ForeignKey("proxy_pools.id"))
    
    # For future gateway: real traffic data
    data_used_mb = Column(Float, default=0.0)
    
    request_count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="usage_logs")

# NOTE: Tables created by Django migrations, not SQLAlchemy
# Base.metadata.create_all(bind=engine) - REMOVED

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    api_key: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    api_key: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubscriptionResponse(BaseModel):
    id: int
    plan: str
    data_limit_gb: float
    data_used_gb: float
    proxy_requests_limit: int
    proxy_requests_used: int
    concurrent_connections: int
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserStatsResponse(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    total_data_used_mb: float
    total_data_used_gb: float
    unique_proxies_used: int
    last_7_days_usage: List[dict]

class ProxyRequest(BaseModel):
    proxy_type: ProxyType
    country: Optional[str] = None
    quantity: int = 1

class ProxyResponse(BaseModel):
    ip_address: str
    port: int
    username: str
    password: str
    country: Optional[str]
    proxy_type: str

class UpdateSubscriptionRequest(BaseModel):
    plan: PlanType

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_api_key():
    return f"pk_{''.join(secrets.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(32))}"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_user_by_api_key(api_key: str, db: Session) -> User:
    user = db.query(User).filter(User.api_key == api_key).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return user

def get_plan_limits(plan: PlanType) -> dict:
    """Get limits for each plan"""
    limits = {
        PlanType.STARTER: {
            "data_limit_gb": 5.0,  # For future gateway
            "proxy_requests_limit": 1000,  # Current MVP
            "concurrent_connections": 50,
        },
        PlanType.PROFESSIONAL: {
            "data_limit_gb": 25.0,
            "proxy_requests_limit": 10000,
            "concurrent_connections": 500,
        },
        PlanType.ENTERPRISE: {
            "data_limit_gb": 1000.0,
            "proxy_requests_limit": 100000,
            "concurrent_connections": 10000,
        }
    }
    return limits.get(plan, limits[PlanType.STARTER])

# API Endpoints
@app.get("/")
def root():
    return {"message": "ProxyFlow API", "version": "1.0.0"}

@app.post("/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_pw = hash_password(user_data.password)
    api_key = generate_api_key()
    
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_pw,
        api_key=api_key
    )
    db.add(user)
    db.flush()
    
    # Create default subscription
    limits = get_plan_limits(PlanType.STARTER)
    subscription = Subscription(
        user_id=user.id,
        plan=PlanType.STARTER,
        data_limit_gb=limits["data_limit_gb"],
        proxy_requests_limit=limits["proxy_requests_limit"],
        concurrent_connections=limits["concurrent_connections"],
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(subscription)
    db.commit()
    db.refresh(user)
    
    return user

@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "api_key": user.api_key
    }

@app.get("/user/me", response_model=UserResponse)
def get_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/user/subscription", response_model=SubscriptionResponse)
def get_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's subscription details"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return subscription

@app.get("/user/stats", response_model=UserStatsResponse)
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user usage statistics"""
    
    # Total stats
    total_requests = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0
    
    successful_requests = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.success == True
    ).scalar() or 0
    
    failed_requests = total_requests - successful_requests
    
    total_data_used_mb = db.query(func.sum(UsageLog.data_used_mb)).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0.0
    
    unique_proxies = db.query(func.count(func.distinct(UsageLog.proxy_id))).filter(
        UsageLog.user_id == current_user.id
    ).scalar() or 0
    
    # Last 7 days usage (by proxy request count)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    last_7_days = []
    
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_requests = db.query(func.count(UsageLog.id)).filter(
            UsageLog.user_id == current_user.id,
            UsageLog.timestamp >= day_start,
            UsageLog.timestamp < day_end
        ).scalar() or 0
        
        last_7_days.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "usage_mb": float(day_requests)  # Count of proxies, not MB
        })
    
    return {
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": failed_requests,
        "total_data_used_mb": float(total_data_used_mb),
        "total_data_used_gb": float(total_data_used_mb / 1024),
        "unique_proxies_used": unique_proxies,
        "last_7_days_usage": last_7_days
    }

@app.put("/user/subscription")
def update_subscription(
    update_data: UpdateSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user subscription plan"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get new plan limits
    limits = get_plan_limits(update_data.plan)
    
    # Update subscription
    subscription.plan = update_data.plan
    subscription.data_limit_gb = limits["data_limit_gb"]
    subscription.proxy_requests_limit = limits["proxy_requests_limit"]
    subscription.concurrent_connections = limits["concurrent_connections"]
    
    # Extend expiration by 30 days
    if subscription.expires_at and subscription.expires_at > datetime.utcnow():
        subscription.expires_at = subscription.expires_at + timedelta(days=30)
    else:
        subscription.expires_at = datetime.utcnow() + timedelta(days=30)
    
    db.commit()
    db.refresh(subscription)
    
    return {
        "message": "Subscription updated successfully",
        "subscription": {
            "plan": subscription.plan.value,
            "data_limit_gb": subscription.data_limit_gb,
            "proxy_requests_limit": subscription.proxy_requests_limit,
            "concurrent_connections": subscription.concurrent_connections,
            "expires_at": subscription.expires_at
        }
    }

@app.post("/proxy/get", response_model=List[ProxyResponse])
def get_proxies(
    request: ProxyRequest,
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Get proxies (MVP: counts proxy requests, not traffic)
    Future: Will be Proxy Gateway that tracks real traffic
    """
    user = get_user_by_api_key(api_key, db)
    
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id
    ).first()
    
    if not subscription or not subscription.is_active:
        raise HTTPException(status_code=403, detail="No active subscription")
    
    # Check if subscription expired
    if subscription.expires_at and subscription.expires_at < datetime.utcnow():
        raise HTTPException(status_code=403, detail="Subscription expired")
    
    # Check proxy request limit (MVP)
    if subscription.proxy_requests_used >= subscription.proxy_requests_limit:
        raise HTTPException(
            status_code=403, 
            detail=f"Proxy request limit exceeded ({subscription.proxy_requests_limit} requests)"
        )
    
    # Check if user can request this many proxies
    remaining = subscription.proxy_requests_limit - subscription.proxy_requests_used
    if request.quantity > remaining:
        raise HTTPException(
            status_code=403,
            detail=f"Cannot request {request.quantity} proxies. Only {remaining} remaining."
        )
    
    query = db.query(ProxyPool).filter(
        ProxyPool.proxy_type == request.proxy_type,
        ProxyPool.is_active == True
    )
    
    if request.country:
        query = query.filter(ProxyPool.country == request.country)
    
    proxies = query.limit(request.quantity).all()
    
    if not proxies:
        raise HTTPException(status_code=404, detail="No proxies available")
    
    # Log usage for each proxy
    for proxy in proxies:
        usage_log = UsageLog(
            user_id=user.id,
            proxy_id=proxy.id,
            data_used_mb=0.0,  # Will be filled by gateway in future
            request_count=1,
            success=True
        )
        db.add(usage_log)
        
        # Update proxy last_used
        proxy.last_used = datetime.utcnow()
    
    # Increment proxy request counter (MVP)
    subscription.proxy_requests_used += len(proxies)
    
    # Note: data_used_gb will be updated by Proxy Gateway in future
    
    db.commit()
    
    return [
        ProxyResponse(
            ip_address=proxy.ip_address,
            port=proxy.port,
            username=user.username,
            password=user.api_key[:16],
            country=proxy.country,
            proxy_type=proxy.proxy_type.value
        )
        for proxy in proxies
    ]

@app.get("/proxy/types")
def get_proxy_types():
    return {
        "types": [
            {"value": "residential", "label": "Residential"},
            {"value": "datacenter", "label": "Datacenter"},
            {"value": "mobile", "label": "Mobile"},
            {"value": "isp", "label": "ISP"}
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)