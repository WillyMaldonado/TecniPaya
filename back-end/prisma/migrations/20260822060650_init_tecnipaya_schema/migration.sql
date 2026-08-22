-- CreateEnum
CREATE TYPE "EstadoLaptop" AS ENUM ('DISPONIBLE', 'PRESTADA', 'EN_REPARACION', 'BAJA_DEFINITIVA');

-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('ACTIVO', 'FINALIZADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licencia" (
    "id" TEXT NOT NULL,
    "codigo_inventario" TEXT NOT NULL,
    "nombre_licencia" TEXT NOT NULL,

    CONSTRAINT "Licencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AltaLaptops" (
    "codigo_inventario" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "proveedor_id" TEXT,
    "maletin" BOOLEAN NOT NULL DEFAULT false,
    "cargador" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoLaptop" NOT NULL DEFAULT 'DISPONIBLE',
    "fecha_baja" TIMESTAMP(3),
    "motivo_baja" TEXT,

    CONSTRAINT "AltaLaptops_pkey" PRIMARY KEY ("codigo_inventario")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "nit" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "contacto" TEXT,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("nit")
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id_prestamo" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "fecha_entrega" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_devolucion" TIMESTAMP(3),
    "costo" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPrestamo" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "Prestamo_pkey" PRIMARY KEY ("id_prestamo")
);

-- CreateTable
CREATE TABLE "prestamo_laptop" (
    "id_prestamo" TEXT NOT NULL,
    "codigo_inventario" TEXT NOT NULL,

    CONSTRAINT "prestamo_laptop_pkey" PRIMARY KEY ("id_prestamo","codigo_inventario")
);

-- CreateTable
CREATE TABLE "Reparacion" (
    "id" TEXT NOT NULL,
    "codigo_inventario" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_estimada_retorno" TIMESTAMP(3),
    "fecha_real_retorno" TIMESTAMP(3),
    "motivo_falla" TEXT NOT NULL,

    CONSTRAINT "Reparacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Licencia" ADD CONSTRAINT "Licencia_codigo_inventario_fkey" FOREIGN KEY ("codigo_inventario") REFERENCES "AltaLaptops"("codigo_inventario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AltaLaptops" ADD CONSTRAINT "AltaLaptops_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_nit_fkey" FOREIGN KEY ("nit") REFERENCES "Cliente"("nit") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_laptop" ADD CONSTRAINT "prestamo_laptop_id_prestamo_fkey" FOREIGN KEY ("id_prestamo") REFERENCES "Prestamo"("id_prestamo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_laptop" ADD CONSTRAINT "prestamo_laptop_codigo_inventario_fkey" FOREIGN KEY ("codigo_inventario") REFERENCES "AltaLaptops"("codigo_inventario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reparacion" ADD CONSTRAINT "Reparacion_codigo_inventario_fkey" FOREIGN KEY ("codigo_inventario") REFERENCES "AltaLaptops"("codigo_inventario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reparacion" ADD CONSTRAINT "Reparacion_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
