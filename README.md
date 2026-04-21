# 🚀 ASMEL Bridge (Access Integration)

## 📌 Descripción

ASMEL Bridge es un servicio intermedio desarrollado en Node.js que permite integrar el sistema ASMEL (cloud) con un sistema legacy basado en Microsoft Access.

Su objetivo es sincronizar datos críticos como empresas y facturas hacia Access utilizando ODBC, asegurando consistencia, control y compatibilidad con sistemas contables existentes.

---

## 🧠 Problema que resuelve

Muchas organizaciones todavía utilizan sistemas legacy como Microsoft Access para su operatoria diaria.

Este proyecto permite:

* Conectar un backend moderno (NestJS + MongoDB)
* Con un sistema legacy (Access)
* Sin modificar el sistema original

👉 Implementando un bridge desacoplado y controlado.

---

## ⚙️ Funcionalidad principal

* 🔄 Sincronización de empresas pendientes
* 🧾 Exportación de facturas hacia Access
* 🔁 Prevención de duplicados (idempotencia)
* 🔒 Control manual de ejecución (no automático)
* 📡 Comunicación con backend ASMEL vía API REST
* 🗄️ Inserción en tablas Access (FC, FCIT, etc.)

---

## 🏗️ Arquitectura

```text
Frontend (Next.js)
        ↓
Backend ASMEL (NestJS)
        ↓
Bridge (Node.js + ODBC)
        ↓
Microsoft Access
```

---

## 🔐 Decisión clave

La sincronización se ejecuta únicamente de forma manual:

👉 Evita errores en procesos críticos de facturación
👉 Permite validar datos antes de exportar
👉 Mejora la confiabilidad del sistema

---

## 🧰 Tecnologías utilizadas

* Node.js
* Express
* TypeScript
* Axios
* ODBC (Access)
* dotenv

---

## 🚀 Endpoints

### Health check

```http
GET /health
```

Respuesta:

```json
{
  "ok": true,
  "service": "asmel-bridge"
}
```

---

### Sincronización manual

```http
POST /sync
```

Ejecuta:

* Exportación de empresas
* Exportación de facturas

---

## ⚙️ Configuración

Crear archivo `.env`:

```env
PORT=3001

ASMEL_API_URL=http://localhost:4000
ASMEL_API_TOKEN=tu_token

ACCESS_DSN=AccessWaldbott
ACCESS_DB_PATH=C:\data\Sgiw14.mdb
```

---

## ▶️ Ejecución

```bash
npm install
npm run build
node dist/index.js
```

---

## 🧪 Flujo de uso

1. Generar factura en ASMEL
2. Revisar datos en frontend
3. Ejecutar sincronización manual
4. Datos exportados a Access

---

## 🧠 Consideraciones

* No se sincroniza automáticamente (por diseño)
* Se evita duplicación de datos
* Se asegura integridad en procesos contables

---

## 📈 Valor del proyecto

Este proyecto demuestra:

* Integración entre sistemas modernos y legacy
* Manejo de procesos críticos (facturación)
* Diseño desacoplado y escalable
* Uso real de ODBC en producción

---

## 👨‍💻 Autor

Ariel Suarez
Backend Developer

---
