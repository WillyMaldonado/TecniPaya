import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LoansService } from './loans.service';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoLaptop, EstadoPrestamo } from '@prisma/client';

describe('LoansService', () => {
  let service: LoansService;

  const txMock = {
    altaLaptops: { updateMany: jest.fn() },
    prestamo: { create: jest.fn(), update: jest.fn() },
    cliente: { update: jest.fn() },
  };

  let prisma: {
    cliente: { findUnique: jest.Mock };
    altaLaptops: { findMany: jest.Mock };
    prestamo: { findMany: jest.Mock; findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  const clienteActivo = {
    nit: '1234567-8',
    nombre: 'Cliente Prueba',
    activo: true,
    saldoPendiente: 0,
  };

  const laptopDisponible = {
    codigoInventario: 'LAP-001',
    estado: EstadoLaptop.DISPONIBLE,
  };

  beforeEach(async () => {
    txMock.altaLaptops.updateMany.mockReset();
    txMock.prestamo.create.mockReset();
    txMock.prestamo.update.mockReset();
    txMock.cliente.update.mockReset();

    prisma = {
      cliente: { findUnique: jest.fn() },
      altaLaptops: { findMany: jest.fn() },
      prestamo: { findMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn((cb: (tx: typeof txMock) => unknown) => cb(txMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoansService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------
  describe('calcularCostoPrestamo', () => {
    it('cobra Q100 por día por laptop', () => {
      const entrega = new Date('2026-08-20T08:00:00.000Z');
      const devolucion = new Date('2026-08-23T08:00:00.000Z'); // 3 días
      const costo = service.calcularCostoPrestamo(entrega, devolucion, 2);

      expect(costo).toBe(3 * 100 * 2); // 600
    });

    it('cobra 1 día si la entrega y devolución son el mismo instante (RN-02)', () => {
      const fecha = new Date('2026-08-20T08:00:00.000Z');
      const costo = service.calcularCostoPrestamo(fecha, fecha, 1);

      expect(costo).toBe(100);
    });

    it('redondea hacia arriba cualquier fracción de día', () => {
      const entrega = new Date('2026-08-20T08:00:00.000Z');
      const devolucion = new Date('2026-08-20T20:00:00.000Z'); // 12 horas
      const costo = service.calcularCostoPrestamo(entrega, devolucion, 1);

      expect(costo).toBe(100); // se cobra 1 día completo
    });

    it('lanza BadRequestException si la devolución es anterior a la entrega', () => {
      const entrega = new Date('2026-08-23T08:00:00.000Z');
      const devolucion = new Date('2026-08-20T08:00:00.000Z');

      expect(() =>
        service.calcularCostoPrestamo(entrega, devolucion, 1),
      ).toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------
  describe('create', () => {
    const dto = {
      clienteId: '1234567-8',
      laptopIds: ['LAP-001'],
      fechaEntrega: '2026-08-23T08:00:00.000Z',
      fechaDevolucionEstimada: '2026-08-28T18:00:00.000Z',
    };

    it('crea el préstamo con costo y fechaDevolucion en null', async () => {
      prisma.cliente.findUnique.mockResolvedValue(clienteActivo);
      prisma.altaLaptops.findMany.mockResolvedValue([laptopDisponible]);
      txMock.altaLaptops.updateMany.mockResolvedValue({ count: 1 });
      const prestamoCreado = {
        id: 'prestamo-1',
        nit: dto.clienteId,
        estado: EstadoPrestamo.ACTIVO,
        costo: null,
        fechaDevolucion: null,
      };
      txMock.prestamo.create.mockResolvedValue(prestamoCreado);

      const resultado = await service.create(dto);

      const dataEnviada = txMock.prestamo.create.mock.calls[0][0].data;
      expect(dataEnviada.costo).toBeUndefined();
      expect(dataEnviada.fechaDevolucion).toBeUndefined();
      expect(resultado).toEqual(prestamoCreado);
    });

    it('lanza BadRequestException si la fecha estimada de devolución es anterior a la entrega', async () => {
      await expect(
        service.create({
          ...dto,
          fechaEntrega: '2026-08-28T08:00:00.000Z',
          fechaDevolucionEstimada: '2026-08-20T08:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.cliente.findUnique).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el cliente no existe o está inactivo', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si alguna laptop no existe en inventario', async () => {
      prisma.cliente.findUnique.mockResolvedValue(clienteActivo);
      prisma.altaLaptops.findMany.mockResolvedValue([]); // ninguna encontrada

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException si una laptop ya no está disponible (RN-03/RN-04)', async () => {
      prisma.cliente.findUnique.mockResolvedValue(clienteActivo);
      prisma.altaLaptops.findMany.mockResolvedValue([laptopDisponible]);
      // El conteo de la actualización atómica no coincide -> otra petición
      // ya tomó la laptop en el mismo instante
      txMock.altaLaptops.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(txMock.prestamo.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  describe('findAll (Historial)', () => {
    it('sin filtros, devuelve where vacío', async () => {
      prisma.prestamo.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.prestamo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filtra por clienteNit (historial de un cliente)', async () => {
      prisma.prestamo.findMany.mockResolvedValue([]);

      await service.findAll({ clienteNit: '1234567-8' });

      expect(prisma.prestamo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { nit: '1234567-8' } }),
      );
    });

    it('filtra por laptopCodigo (historial de una laptop)', async () => {
      prisma.prestamo.findMany.mockResolvedValue([]);

      await service.findAll({ laptopCodigo: 'LAP-001' });

      expect(prisma.prestamo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            laptops: { some: { codigoInventario: 'LAP-001' } },
          },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------
  describe('findOne', () => {
    it('devuelve el préstamo cuando existe', async () => {
      const prestamoMock = { id: 'prestamo-1' };
      prisma.prestamo.findUnique.mockResolvedValue(prestamoMock);

      const resultado = await service.findOne('prestamo-1');

      expect(resultado).toEqual(prestamoMock);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      prisma.prestamo.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------
  describe('cerrarPrestamo', () => {
    const prestamoActivo = {
      id: 'prestamo-1',
      nit: '1234567-8',
      estado: EstadoPrestamo.ACTIVO,
      fechaEntrega: new Date('2026-08-20T08:00:00.000Z'),
      laptops: [{ codigoInventario: 'LAP-001' }],
    };

    it('cierra el préstamo, libera laptops y suma el costo al saldo (RN-06)', async () => {
      prisma.prestamo.findUnique.mockResolvedValue(prestamoActivo);
      txMock.prestamo.update.mockResolvedValue({
        ...prestamoActivo,
        estado: EstadoPrestamo.FINALIZADO,
      });
      txMock.altaLaptops.updateMany.mockResolvedValue({ count: 1 });
      txMock.cliente.update.mockResolvedValue({});

      await service.cerrarPrestamo('prestamo-1');

      expect(txMock.prestamo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prestamo-1' },
          data: expect.objectContaining({ estado: EstadoPrestamo.FINALIZADO }),
        }),
      );
      expect(txMock.altaLaptops.updateMany).toHaveBeenCalledWith({
        where: { codigoInventario: { in: ['LAP-001'] } },
        data: { estado: EstadoLaptop.DISPONIBLE },
      });
      expect(txMock.cliente.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { nit: '1234567-8' },
          data: { saldoPendiente: { increment: expect.any(Number) } },
        }),
      );
    });

    it('lanza NotFoundException si el préstamo no existe', async () => {
      prisma.prestamo.findUnique.mockResolvedValue(null);

      await expect(service.cerrarPrestamo('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza BadRequestException si el préstamo ya fue finalizado', async () => {
      prisma.prestamo.findUnique.mockResolvedValue({
        ...prestamoActivo,
        estado: EstadoPrestamo.FINALIZADO,
      });

      await expect(service.cerrarPrestamo('prestamo-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(txMock.prestamo.update).not.toHaveBeenCalled();
    });
  });
});
