# TecniPaya

Sistema de gestión de inventario y control de alquileres para **TecniPaya**.

El proyecto permite administrar clientes, proveedores, laptops e inventario, además de gestionar préstamos, devoluciones y estados de los equipos.

## 🚀 Tecnologías

### Backend
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- pnpm
- Docker

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Lucide React

### Infraestructura
- Docker
- Docker Compose
- Nginx
- PostgreSQL 15

## 📁 Estructura del proyecto

```text
TecniPaya/
├── back-end/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── clients/
│   │   ├── laptops/
│   │   ├── loans/
│   │   ├── suppliers/
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── front-end/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## ⚙️ Requisitos

Para ejecutar el proyecto mediante Docker necesitas:

- Docker
- Docker Compose

Comprueba las instalaciones:

```bash
docker --version
docker compose version
```

No es necesario instalar Node.js, pnpm ni PostgreSQL localmente para ejecutar el proyecto mediante Docker.

# 🐳 Ejecutar el proyecto con Docker

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd TecniPaya
```

## 2. Crear el archivo `.env`

```bash
cp .env.example .env
```

Contenido por defecto:

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tecnipaya
```

> Para producción se recomienda utilizar credenciales seguras.

## 3. Levantar el proyecto

```bash
docker compose up -d --build
```

Docker se encargará automáticamente de:

1. Crear la red.
2. Crear PostgreSQL.
3. Esperar a que PostgreSQL esté disponible.
4. Ejecutar las migraciones de Prisma.
5. Ejecutar el seed.
6. Iniciar el backend.
7. Esperar a que el backend esté saludable.
8. Iniciar el frontend mediante Nginx.

## 4. Comprobar los contenedores

```bash
docker compose ps
```

| Servicio | Puerto | Descripción |
|---|---:|---|
| Frontend | `8080` | Aplicación web |
| Backend | `3000` | API REST |
| PostgreSQL | `5432` | Base de datos |

## 🌐 Acceso

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

# 🔌 API

## Clientes

```text
POST   /clientes
GET    /clientes
GET    /clientes/:nit
PATCH  /clientes/:nit
DELETE /clientes/:nit
```

## Proveedores

```text
POST   /proveedores
GET    /proveedores
GET    /proveedores/:id
PATCH  /proveedores/:id
DELETE /proveedores/:id
```

## Laptops

```text
POST   /laptops
GET    /laptops
GET    /laptops/:codigoInventario
PATCH  /laptops/:codigoInventario
DELETE /laptops/:codigoInventario/baja-definitiva

POST   /laptops/:codigoInventario/reparacion
PATCH  /laptops/:codigoInventario/reparacion/retorno
```

## Préstamos

```text
POST   /loans
GET    /loans
GET    /loans/:id
PATCH  /loans/:id/cerrar
```

# 🗄️ Base de datos

El proyecto utiliza PostgreSQL y Prisma.

Las migraciones se encuentran en:

```text
back-end/prisma/migrations/
```

Al iniciar mediante Docker se ejecuta automáticamente:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
```

# 🌱 Datos iniciales

El seed genera datos de prueba:

- 3 proveedores
- 3 clientes
- 6 laptops
- 1 laptop en reparación
- 1 laptop dada de baja definitiva
- 2 laptops prestadas
- 2 laptops disponibles
- 1 préstamo activo con 2 laptops
- 1 préstamo finalizado con costo de Q500.00

El seed se encuentra en:

```text
back-end/prisma/seed.ts
```

# 🛠️ Desarrollo local

## Backend

```bash
cd back-end
pnpm install
pnpm exec prisma migrate dev
pnpm exec prisma db seed
pnpm start:dev
```

Backend:

```text
http://localhost:3000
```

## Frontend

```bash
cd front-end
pnpm install
pnpm dev
```

# 🐳 Comandos útiles

### Levantar

```bash
docker compose up -d
```

### Reconstruir

```bash
docker compose up -d --build
```

### Detener

```bash
docker compose down
```

### Detener y eliminar la base de datos

> Esto elimina también los datos de PostgreSQL.

```bash
docker compose down -v
```

### Estado

```bash
docker compose ps
```

### Logs del backend

```bash
docker compose logs backend
```

### Logs del frontend

```bash
docker compose logs frontend
```

### Logs de PostgreSQL

```bash
docker compose logs postgres
```

### Todos los logs

```bash
docker compose logs -f
```

# 🔄 Reiniciar completamente

Para empezar con una base de datos limpia:

```bash
docker compose down -v
docker compose up -d --build
```

Esto recrea PostgreSQL y ejecuta nuevamente las migraciones y el seed.

# 🔐 Variables de entorno

El proyecto utiliza:

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tecnipaya
```

Para crear uno nuevo:

```bash
cp .env.example .env
```


## 👨‍💻 Proyecto

**TecniPaya**

Sistema de gestión de inventario y control de alquileres.
