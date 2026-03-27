from auth_utils import get_password_hash

import models
from database import SessionLocal, engine


def crear_usuario_inicial():
    db = SessionLocal()
    
    try:
        admin_existente = db.query(models.Usuarios).filter(models.Usuarios.nombre == "admin").first()
        
        if admin_existente:
            print(" El usuario 'Admin' ya existe en la base de datos.")
            return

        nombre_usuario = "repuestosJN"
        password_plana="jnrepuestos2026"
        
        password_encriptada = get_password_hash(password_plana)
        
        nuevo_admin = models.Usuarios(nombre= nombre_usuario, hashed_password= password_encriptada)
        
        
        db.add(nuevo_admin)
        db.commit()
        print("Usuario creado con exito")
        
        
    except Exception as e:
        print(f"Error al crear el usuario: {e}")
        db.rollback()
    finally:
        db.close()
        
    
if __name__ == "__main__":
    crear_usuario_inicial()