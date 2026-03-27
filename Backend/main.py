from datetime import date, timedelta
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
from sqlalchemy.orm import Session,joinedload
from typing import List
import models , schemas
from database import engine, get_db
from auth_utils import verify_password, create_access_token 



# crea las tablas en la bd(magia de SQLAlchemy)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Stock - Repuestos JN")

# CONFIGURACION DE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins= ["*"], 
    allow_credentials = True,
    allow_methods = ["*"],# Permite get, post, put, delete, etc.
    allow_headers = ["*"],
)

@app.post("/repuestos", response_model=schemas.Repuesto)
def crear_repuesto(repuesto:schemas.RepuestoCreate, db:Session=Depends(get_db)):
    # convertimos el esquema de pydantic a un modelo de sqlalchemy
    nuevo_item = models.Repuesto(**repuesto.model_dump())
    
    # lo agregamos a la sesion de la bd
    db.add(nuevo_item)
    
    # guardamos los cambios
    try:
        db.commit()
        db.refresh(nuevo_item)
        return nuevo_item
    except Exception as e:
        db.rollback() # si hay error, volvemos atras
        raise HTTPException(status_code=400, detail="El código de barra ya existe o hubo un error")



@app.get("/repuestos", response_model=List[schemas.Repuesto])
def leer_repuestos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # esta linea busca todos los repuestos que esten activos
    repuestos = db.query(models.Repuesto).filter(models.Repuesto.activo==True).offset(skip).limit(limit).all()
    return repuestos


@app.get("/historial",  response_model=List[schemas.VentaRead])
def obtener_historial(fecha: date = None, db: Session = Depends(get_db)):
    # Importante: Usamos .options(joinedload(...)) para forzar la carga de los hijos    
    query = db.query(models.Venta).options(joinedload(models.Venta.detalles))
    
    if fecha:
        query = query.filter(func.date(models.Venta.fecha) == fecha)
    
    ventas = query.order_by(models.Venta.fecha.desc()).all()
    
    if ventas:
        print(f"Venta #1 tiene {len(ventas[0].detalles)} productos")
        
    return ventas

@app.post("/ventas/descontar")
def descontar_Stock(id_producto: int, cantidad: int, db: Session= Depends(get_db)):
    # Buscamos el producto en la BD
    producto = db.query(models.Repuesto).filter(models.Repuesto.id == id_producto). first()

    # Que pasa si el stock es insuficiente
    if producto.stock< cantidad:
        raise HTTPException(status_code=400, detail="Stock Insuficiente, recargar ya mismo el stock del producto")
    
    # actualizacion
    producto.stock = producto.stock - cantidad
    
    # guardar cambios
    db.commit()
    db.refresh(producto)
    return {"mensaje":"Stock actualizado con éxito!", "nuevo_stock": producto.stock}


@app.post("/ventas")
def realizar_venta(carrito: List[schemas.ItemVenta],db:Session= Depends(get_db)):
    # Calculamos el total de la venta en el servidor
    total_venta=0
    objetos_detalle=[] # aqui guardamos los detalles antes de subir todo
    for item in carrito:
        db_repuesto= db.query(models.Repuesto).filter(models.Repuesto.id == item.id).first()
        
        if not db_repuesto:
            raise HTTPException(status_code= 404, detail=f"Repuesto ID {item.id} no encontrado")
        
        # verificar si hay stock suficiente
        if db_repuesto.stock < item.cantidad:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {db_repuesto.nombre}")
        
        # restamos el stock
        db_repuesto.stock -= item.cantidad
        
        #sumar al total
        subtotal = db_repuesto.precio * item.cantidad
        total_venta+= subtotal
        
        #preparamos el detalle, pero sin guardarlo todavia
        nuevo_detalle = models.DetalleVenta(
            repuesto_id = item.id,
            cantidad = item.cantidad,
            precio_unitario = db_repuesto.precio
        )
        objetos_detalle.append(nuevo_detalle)
        
    # Creamos la venta principal
    nueva_venta = models.Venta(total = total_venta, detalles=objetos_detalle)
        
    db.add(nueva_venta)
    db.commit()
    return {"message": "Venta e Historial guardados"}


@app.put("/repuestos/{repuesto_id}")
def actualizar_repuesto(repuesto_id: int, repuesto_actualizado: schemas.RepuestoCreate, db: Session = Depends(get_db)):
    db_repuesto = db.query(models.Repuesto).filter(models.Repuesto.id == repuesto_id).first()
    
    if not db_repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")

    # Actualización de campos
    db_repuesto.nombre = repuesto_actualizado.nombre
    db_repuesto.codigo_barra = repuesto_actualizado.codigo_barra
    db_repuesto.marca = repuesto_actualizado.marca
    db_repuesto.precio = repuesto_actualizado.precio
    db_repuesto.stock = repuesto_actualizado.stock
    db_repuesto.proveedor = repuesto_actualizado.proveedor

    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto


@app.get("/estadisticas")
def obtener_estadisticas(db:Session= Depends(get_db)):
    # total ventas
    total_recaudado = db.query(func.sum(models.Venta.total)).scalar() or 0
    
    # producto mas vendido
    top_producto = db.query(models.Repuesto.nombre, func.sum(models.DetalleVenta.cantidad).label('Total')).join(models.DetalleVenta).group_by(models.Repuesto.id).order_by(text('Total DESC')).first()
    
    return {
        "recaudado ": total_recaudado,
        "mas_vendido" : top_producto[0] if top_producto else "N/A"
    }
    

#1. Gráfico para ventas de los ultimos 7 dias
@app.get("/stats/ventas-semanales")
def estadisticas_ventas(db:Session=Depends(get_db)):
    hace_una_semana= date.today() - timedelta(days=7)
    res = db.query(func.date(models.Venta.fecha).label('d'), func.sum(models.Venta.total)).filter(models.Venta.fecha >= hace_una_semana).group_by('d').all()
    return [{"name": r[0].strftime("%d/%m"), "valor": r[1]} for r in res]


# 2. Distribución por Marcas (Para el gráfico de Torta)
@app.get("/stats/marcas")
def stats_marcas(db: Session = Depends(get_db)):
    res = db.query(models.Repuesto.marca, func.count(models.Repuesto.id)).group_by(models.Repuesto.marca).all()
    return [{"name": r[0], "value": r[1]} for r in res]

# 3. Top 5 Productos con más Stock (Para saber qué hay más en el estante)
@app.get("/stats/stock-alto")
def stats_stock(db: Session = Depends(get_db)):
    res = db.query(models.Repuesto.nombre, models.Repuesto.stock).order_by(models.Repuesto.stock.desc()).limit(5).all()
    return [{"name": r[0], "cantidad": r[1]} for r in res]



# 4. Ticket Promedio (¿Cuánto gasta un cliente cada vez que viene?)
@app.get("/stats/ticket-promedio")
def stats_ticket(db: Session = Depends(get_db)):
    res = db.query(func.avg(models.Venta.total)).scalar() or 0
    return {"valor": round(res, 2)}

# 5. Ranking de Proveedores (¿A quién le compramos más variedad?)
@app.get("/stats/proveedores-top")
def stats_proveedores(db: Session = Depends(get_db)):
    res = db.query(models.Repuesto.proveedor, func.count(models.Repuesto.id)).filter(models.Repuesto.proveedor != None).group_by(models.Repuesto.proveedor).all()
    return [{"name": r[0], "cantidad": r[1]} for r in res]

# 6. Horarios de mayor venta (¿A qué hora entra más gente?)
@app.get("/stats/horas-pico")
def stats_horas(db: Session = Depends(get_db)):
    # Extraemos la hora de la fecha de venta
    res = db.query(func.extract('hour', models.Venta.fecha).label('hora'), func.count(models.Venta.id)).group_by('hora').all()
    return [{"hora": f"{int(r[0])}hs", "ventas": r[1]} for r in res]



# 7. Ranking Top 5 Productos más vendidos (por cantidad de unidades)
@app.get("/stats/top-vendidos")
def stats_top_vendidos(db: Session = Depends(get_db)):
    # Unimos DetalleVenta con Repuesto para traer el nombre
    res = db.query(
        models.Repuesto.nombre, 
        func.sum(models.DetalleVenta.cantidad).label('total_vendido')
    ).join(models.DetalleVenta).group_by(models.Repuesto.id)\
     .order_by(text('total_vendido DESC')).limit(5).all()
    
    return [{"name": r[0], "ventas": r[1]} for r in res]

# 8. Comparativa Mensual (Total ventas de este mes vs el anterior)
@app.get("/stats/comparativa-mensual")
def stats_comparativa(db: Session = Depends(get_db)):
    hoy = date.today()
    primer_dia_mes_actual = hoy.replace(day=1)
    ultimo_dia_mes_pasado = primer_dia_mes_actual - timedelta(days=1)
    primer_dia_mes_pasado = ultimo_dia_mes_pasado.replace(day=1)

    # Suma mes actual
    actual = db.query(func.sum(models.Venta.total)).filter(models.Venta.fecha >= primer_dia_mes_actual).scalar() or 0
    # Suma mes pasado
    pasado = db.query(func.sum(models.Venta.total)).filter(
        models.Venta.fecha >= primer_dia_mes_pasado, 
        models.Venta.fecha <= ultimo_dia_mes_pasado
    ).scalar() or 0

    return [
        {"name": "Mes Pasado", "total": pasado},
        {"name": "Mes Actual", "total": actual}
    ]
    
    
@app.post("/login")
def login(datos: schemas.LoginRequest, db:Session=Depends(get_db)):
    
    # Busca el usuario en la bd por su nombre
    usuario_db = db.query(models.Usuarios).filter(models.Usuarios.nombre== datos.nombre).first()
    
    # si no existe el usuario, lanza el error
    if not usuario_db:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        
        
    #verifica la contraseña
    es_valida=verify_password(datos.password, usuario_db.hashed_password)
    
    if not es_valida:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    token = create_access_token(data={"sub":usuario_db.nombre})
    
    return {"access_token" : token , "token_type" : "bearer"}