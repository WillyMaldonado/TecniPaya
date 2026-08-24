import 'dotenv/config';
import { PrismaClient, EstadoLaptop, EstadoPrestamo } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Limpiando datos existentes...');
  // Orden inverso de dependencias para respetar las llaves foráneas
  await prisma.prestamoLaptop.deleteMany();
  await prisma.prestamo.deleteMany();
  await prisma.reparacion.deleteMany();
  await prisma.licencia.deleteMany();
  await prisma.altaLaptops.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.proveedor.deleteMany();

  console.log('Creando proveedores...');
  const proveedorDell = await prisma.proveedor.create({
    data: { nombre: 'Dell Guatemala', activo: true },
  });
  const proveedorHp = await prisma.proveedor.create({
    data: { nombre: 'HP Centroamérica', activo: true },
  });
  const proveedorLenovo = await prisma.proveedor.create({
    data: { nombre: 'Lenovo Guatemala', activo: true },
  });

  console.log('Creando clientes...');
  const clienteSanMarcos = await prisma.cliente.create({
    data: {
      nit: '1234567-8',
      nombre: 'Comercial San Marcos, S.A.',
      telefono: '2233-4455',
      contacto: 'Ana López',
      activo: true,
      saldoPendiente: 0,
    },
  });
  const clienteElProgreso = await prisma.cliente.create({
    data: {
      nit: '9876543-2',
      nombre: 'Distribuidora El Progreso',
      telefono: '5566-7788',
      contacto: 'Carlos Méndez',
      activo: true,
      saldoPendiente: 0,
    },
  });
  await prisma.cliente.create({
    data: {
      nit: '5555555-5',
      nombre: 'Inversiones del Valle, S.A.',
      telefono: '4422-3311',
      contacto: 'María Fernández',
      activo: true,
      saldoPendiente: 0,
    },
  });

  console.log('Creando laptops...');

  // Laptops DISPONIBLES desde el inicio
  await prisma.altaLaptops.create({
    data: {
      codigoInventario: 'LAP-001',
      marca: 'Dell',
      modelo: 'Latitude 5420',
      proveedorId: proveedorDell.id,
      maletin: true,
      cargador: true,
      estado: EstadoLaptop.DISPONIBLE,
      licencias: {
        create: [{ nombreLicencia: 'Windows 11 Pro' }],
      },
    },
  });

  // Estas dos quedarán PRESTADA por el préstamo ACTIVO de abajo
  await prisma.altaLaptops.create({
    data: {
      codigoInventario: 'LAP-002',
      marca: 'HP',
      modelo: 'EliteBook 840',
      proveedorId: proveedorHp.id,
      maletin: true,
      cargador: true,
      estado: EstadoLaptop.PRESTADA,
      licencias: {
        create: [
          { nombreLicencia: 'Windows 11 Pro' },
          { nombreLicencia: 'Office 365' },
        ],
      },
    },
  });
  await prisma.altaLaptops.create({
    data: {
      codigoInventario: 'LAP-003',
      marca: 'Lenovo',
      modelo: 'ThinkPad T14',
      proveedorId: proveedorLenovo.id,
      maletin: false,
      cargador: true,
      estado: EstadoLaptop.PRESTADA,
    },
  });

  // EN_REPARACION, con su registro de reparación abierto
  await prisma.altaLaptops.create({
    data: {
      codigoInventario: 'LAP-004',
      marca: 'Dell',
      modelo: 'Latitude 5520',
      proveedorId: proveedorDell.id,
      maletin: true,
      cargador: true,
      estado: EstadoLaptop.EN_REPARACION,
      reparaciones: {
        create: [
          {
            proveedorId: proveedorDell.id,
            fechaEnvio: new Date('2026-08-15'),
            fechaEstimadaRetorno: new Date('2026-08-30'),
            motivoFalla: 'No enciende',
          },
        ],
      },
    },
  });

  // BAJA_DEFINITIVA
  await prisma.altaLaptops.create({
    data: {
      codigoInventario: 'LAP-005',
      marca: 'HP',
      modelo: 'ProBook 450',
      proveedorId: proveedorHp.id,
      maletin: false,
      cargador: false,
      estado: EstadoLaptop.BAJA_DEFINITIVA,
      fechaBaja: new Date('2026-07-20'),
      motivoBaja: 'Equipo obsoleto, batería ya no retiene carga',
    },
  });

  // DISPONIBLE (fue devuelta tras el préstamo FINALIZADO de abajo)
  await prisma.altaLaptops.create({
    data: {
      codigoInventario: 'LAP-006',
      marca: 'Lenovo',
      modelo: 'ThinkPad T480',
      proveedorId: proveedorLenovo.id,
      maletin: true,
      cargador: true,
      estado: EstadoLaptop.DISPONIBLE,
    },
  });

  console.log('Creando préstamo ACTIVO (2 laptops, mismo cliente)...');
  await prisma.prestamo.create({
    data: {
      cliente: { connect: { nit: clienteSanMarcos.nit } },
      fechaEntrega: new Date('2026-08-18'),
      estado: EstadoPrestamo.ACTIVO,
      // costo y fechaDevolucion quedan null: aún no se ha devuelto
      laptops: {
        create: [
          { codigoInventario: 'LAP-002' },
          { codigoInventario: 'LAP-003' },
        ],
      },
    },
  });

  console.log(
    'Creando préstamo FINALIZADO (ejemplo RN-01 del documento: 5 días, Q500.00)...',
  );
  const costoEjemplo = 5 * 100 * 1; // 5 días x Q100 x 1 laptop = Q500.00
  await prisma.prestamo.create({
    data: {
      cliente: { connect: { nit: clienteElProgreso.nit } },
      fechaEntrega: new Date('2026-08-10'),
      fechaDevolucion: new Date('2026-08-15'),
      costo: costoEjemplo,
      estado: EstadoPrestamo.FINALIZADO,
      laptops: {
        create: [{ codigoInventario: 'LAP-006' }],
      },
    },
  });

  // Reflejar el cargo del préstamo cerrado en el saldo del cliente (RN-06)
  await prisma.cliente.update({
    where: { nit: clienteElProgreso.nit },
    data: { saldoPendiente: { increment: costoEjemplo } },
  });

  console.log('Seed completado ✅');
  console.log('  - 3 proveedores');
  console.log('  - 3 clientes');
  console.log('  - 6 laptops (1 EN_REPARACION, 1 BAJA_DEFINITIVA, 2 PRESTADA, 2 DISPONIBLE)');
  console.log('  - 1 préstamo ACTIVO con 2 laptops');
  console.log('  - 1 préstamo FINALIZADO con costo Q500.00 reflejado en saldo del cliente');
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
