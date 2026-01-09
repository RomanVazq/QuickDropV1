# 📦 QuickDrop V1: SaaS Multi-Tenant para Comercio Local

**QuickDrop** es una infraestructura **SaaS (Software as a Service)** de alto rendimiento diseñada para que negocios locales (barberías, estéticas, tiendas minoristas) digitalicen su operación de manera profesional en cuestión de minutos. 

A diferencia de un catálogo estático, QuickDrop ofrece un ecosistema completo de gestión con identidad dinámica, control de inventario y un modelo económico basado en créditos.

---

## 🚀 Propuesta de Valor

* **Identidad Dinámica:** Los negocios personalizan su marca (logos, colores, catálogos) en tiempo real desde un panel administrativo.
* **Modelo XM (Credits):** Sistema de monetización por uso. **1 XM = 1 Pedido**. Un modelo justo y escalable.
* **Arquitectura Multi-Tenant:** Una única base de código capaz de servir a miles de clientes (inquilinos) con aislamiento de datos seguro.
* **Mobile-First:** Interfaz ultra-ligera optimizada para la conversión en dispositivos móviles.

---

## 🛠️ Stack Tecnológico

* **Backend:** FastAPI (Python 3.9+) - Asíncrono y de alto rendimiento.
* **Base de Datos:** PostgreSQL con SQLAlchemy ORM.
* **Almacenamiento:** Supabase Storage (Gestión de imágenes y activos).
* **Frontend:** React + Vite + Tailwind CSS.
* **Seguridad:** Autenticación JWT y validación de origen mediante `X-Internal-Key`.

---

## 🏗️ Arquitectura y Seguridad

El sistema implementa capas de seguridad avanzadas para proteger la integridad de los datos de cada negocio:
1.  **Aislamiento de Datos:** Cada petición es filtrada por `tenant_id` mediante Middlewares y dependencias de FastAPI.
2.  **Caché en Memoria:** Implementación de `fastapi-cache2` para reducir la latencia en las vistas públicas de los negocios.
3.  **Integridad de Stock:** Uso de bloqueos de base de datos (`WITH FOR UPDATE`) para prevenir errores de sobreventa durante picos de tráfico.



---

## 👨‍💻 Guía de Instalación para Desarrolladores

### 1. Requisitos Previos
* Python 3.9+
* Node.js (LTS)
* Instancia de PostgreSQL
* Cuenta de Supabase (Bucket de `images` creado)

### 2. Configuración del Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt