from sqlalchemy import Column, Integer, String,Float, Numeric, Boolean,ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Repuesto(Base):
    __tablename__ = "Repuestos"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo_barra = Column(String, unique=True, index=True, nullable=False)
    nombre = Column(String, nullable=False)
    marca = Column(String)
    precio = Column(Numeric(precision=10, scale=2), default=0.0)
    stock = Column(Integer, default=0)
    proveedor = Column(String, nullable=True)
    activo = Column(Boolean, default=True)
    
    @property
    def es_critico(self):
        return self.stock< 3
    
    
class Venta (Base):
    __tablename__="ventas"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=datetime.utcnow)
    total = Column(Float)
    
    # una venta tiene muchos detalles
    detalles = relationship("DetalleVenta", back_populates="venta",lazy="joined")
    
class DetalleVenta(Base):
    __tablename__ = "detalles_ventas"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    repuesto_id = Column(Integer, ForeignKey("Repuestos.id"))
    cantidad = Column(Integer)
    precio_unitario = Column(Float)


    venta = relationship("Venta", back_populates="detalles")
    #para saber que repuesto era, aunque se borre el stock
    repuesto = relationship("Repuesto")    
    
    
class Usuarios(Base):
    __tablename__ = "Usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)