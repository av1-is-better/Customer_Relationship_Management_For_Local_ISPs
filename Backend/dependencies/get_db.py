import os
from dotenv import load_dotenv
#from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker

load_dotenv()

# POSTGRES SESSION MAKER
DB_CREDS = {
    "DB_USERNAME" : str(os.getenv("DB_USERNAME")),
    "DB_PASSWORD" : str(os.getenv("DB_PASSWORD")),
    "DB_NAME" : str(os.getenv("DB_NAME")),
    "DB_HOST" : str(os.getenv("DB_HOST")),
    "DB_PORT" : str(os.getenv("DB_PORT"))
    }

DB_URL = f"postgresql+asyncpg://{DB_CREDS["DB_USERNAME"]}:{DB_CREDS["DB_PASSWORD"]}@{DB_CREDS["DB_HOST"]}:{DB_CREDS["DB_PORT"]}/{DB_CREDS["DB_NAME"]}"
#Base = declarative_base()
# Create the SQLAlchemy engine
engine = create_async_engine(DB_URL, echo=False)  # Enable logging for debugging
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

# Dependency to get the database session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session