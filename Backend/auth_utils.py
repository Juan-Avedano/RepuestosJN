from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt

from Backend.claveSecreta import SECRET_KEY


ALGORITHM = "HS256"
ACCES_TOKEN_EXPIRE_MINUTES=60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")

#Metodo para hashear la contraseña 
def get_password_hash(password:str):
    contraseña_hasheada = pwd_context.hash(password)
    return contraseña_hasheada

#Metodo para verificar contraseñas
def verify_password(plain_password: str, hashed_password: str):
    verificar_contraseña = pwd_context.verify(plain_password, hashed_password)
    return verificar_contraseña

#Creamos token cuando el usuario se loguee
def create_access_token(data:dict):
    to_encode = data.copy()
    
    expire = datetime.now(timezone.utc) + timedelta(minutes = ACCES_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp":expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return token