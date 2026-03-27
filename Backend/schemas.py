from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal
from typing import List, Optional

# esquema base (lo que comparten todos)
class RepuestoBase(BaseModel):
    codigo_barra:str
    nombre:str
    marca:Optional[str]=None
    precio: Decimal 
    stock: int 
    proveedor: Optional[str] = None
    
    
# esquema para crear (lo que recibimos del frontend)
class RepuestoCreate(RepuestoBase):
    pass # no necesitamos nada extra, usamos lo de base


# esquema que la api devuelve al frontend (response)
class Repuesto(RepuestoBase):
    id:int
    activo:bool
    
    class Config:
        from_attributes =True 
        
class ItemVenta(BaseModel):
    id: int
    cantidad : int
    
# esquema para el renglon del detalle
class DetalleVentaRead(BaseModel):
    cantidad: int
    precio_unitario: float
    repuesto: RepuestoBase # trae el nombre del producto automaticamente
class VentaRead(BaseModel):
    id: int
    fecha : datetime
    total : float
    detalles: List[DetalleVentaRead]
    class Config:
        from_attributes = True
        
        
class LoginRequest(BaseModel):
    nombre: str
    password: str
