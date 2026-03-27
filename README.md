# 📦 J·N Gestión de Repuestos - Sistema Fullstack

Sistema profesional de gestión de inventario y control de ventas desarrollado para un comercio de autopartes en Córdoba, Argentina. La aplicación resuelve la digitalización de stock, seguimiento de ventas en tiempo real y análisis de métricas comerciales.

## 🚀 Demo en Vivo
* **Frontend:** [https://repuestos-jn.vercel.app](https://repuestos-jn.vercel.app)
## ✨ Características Principales
* **Dashboard de Analítica:** Visualización dinámica de ventas semanales, ticket promedio, horas pico y detección de stock crítico mediante gráficos interactivos.
* **Control de Inventario (CRUD):** Gestión completa de repuestos con filtrado avanzado por nombre, código de barras, marca y proveedor.
* **Terminal de Ventas:** Carrito de compras con validación lógica de stock y persistencia en historial de transacciones.
* **Seguridad Robusta:** Autenticación de administrador mediante **JWT (JSON Web Tokens)**, protección de rutas y hashing de contraseñas con **Passlib/Bcrypt**.
* **Arquitectura Escalable:** Separación clara entre lógica de negocio (Backend) y capa de presentación (Frontend).

## 🛠️ Stack Tecnológico

### Backend (API REST)
* **Python + FastAPI:** Framework moderno de alto rendimiento.
* **PostgreSQL:** Base de datos relacional para almacenamiento seguro de datos.
* **SQLAlchemy (ORM):** Gestión de modelos de datos y consultas eficiente.
* **Render:** Hosting del servidor y despliegue continuo (CD).

### Frontend (SPA)
* **React + TypeScript:** Interfaz de usuario robusta, tipada y mantenible.
* **Tailwind CSS:** Diseño moderno, responsivo y optimizado para escritorio.
* **Recharts:** Implementación de gráficos estadísticos dinámicos.
* **Vercel:** Despliegue del cliente frontend con integración de GitHub.
