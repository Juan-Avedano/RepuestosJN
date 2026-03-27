from sqlalchemy import  create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# formato: postgresql://usuario:password@localhost:5332/nombre_db
SQLALCHEMY_DATABASE_URL= "postgresql://postgres:juancho16@localhost:5432/repuestos_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit = False, autoflush=False, bind=engine)

Base = declarative_base()

# dependencia para obtener la sesion de db en los endpoints

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()