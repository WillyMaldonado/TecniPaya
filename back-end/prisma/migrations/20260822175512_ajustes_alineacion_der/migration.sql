/*
  Warnings:

  - Made the column `proveedor_id` on table `AltaLaptops` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contacto` on table `Cliente` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AltaLaptops" DROP CONSTRAINT "AltaLaptops_proveedor_id_fkey";

-- AlterTable
ALTER TABLE "AltaLaptops" ALTER COLUMN "proveedor_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "contacto" SET NOT NULL;

-- AlterTable
ALTER TABLE "Prestamo" ALTER COLUMN "costo" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AltaLaptops" ADD CONSTRAINT "AltaLaptops_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
