# 1. Usamos una imagen liviana de Python
FROM python:3.11-slim

# 2. Seteamos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos el archivo de dependencias
COPY requirements.txt .

# 4. Instalamos las librerías
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiamos todo el código de nuestro backend a la carpeta /app
COPY . .

# 6. Exponemos el puerto que usa FastAPI (por defecto 8000)
EXPOSE 8000

# 7. Comando para arrancar la app con Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]