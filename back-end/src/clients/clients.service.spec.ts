import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientesService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientesService', () => {
  let service: ClientesService;
  let prisma: {
    cliente: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const clienteMock = {
    nit: '123456-7',
    nombre: 'Cliente Prueba',
    telefono: '12345678',
    contacto: 'Juan Perez',
    activo: true,
    saldoPendiente: 0,
  };

  beforeEach(async () => {
    prisma = {
      cliente: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('crea el cliente cuando el NIT no existe todavía', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);
      prisma.cliente.create.mockResolvedValue(clienteMock);

      const dto = {
        nit: '123456-7',
        nombre: 'Cliente Prueba',
        telefono: '12345678',
        contacto: 'Juan Perez',
      };
      const resultado = await service.create(dto);

      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { nit: dto.nit },
      });
      expect(prisma.cliente.create).toHaveBeenCalledWith({ data: dto });
      expect(resultado).toEqual(clienteMock);
    });

    it('lanza ConflictException si el NIT ya existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(clienteMock);

      const dto = {
        nit: '123456-7',
        nombre: 'Cliente Prueba',
        telefono: '12345678',
        contacto: 'Juan Perez',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.cliente.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devuelve el cliente cuando existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(clienteMock);

      const resultado = await service.findOne('123456-7');

      expect(resultado).toEqual(clienteMock);
    });

    it('lanza NotFoundException cuando no existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('filtra solo activos por defecto', async () => {
      prisma.cliente.findMany.mockResolvedValue([clienteMock]);

      await service.findAll();

      expect(prisma.cliente.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      });
    });

    it('incluye inactivos cuando soloActivos es false', async () => {
      prisma.cliente.findMany.mockResolvedValue([clienteMock]);

      await service.findAll(false);

      expect(prisma.cliente.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('inactivar', () => {
    it('actualiza activo a false', async () => {
      prisma.cliente.findUnique.mockResolvedValue(clienteMock);
      prisma.cliente.update.mockResolvedValue({
        ...clienteMock,
        activo: false,
      });

      await service.inactivar('123456-7');

      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { nit: '123456-7' },
        data: { activo: false },
      });
    });

    it('lanza NotFoundException si el cliente no existe', async () => {
      prisma.cliente.findUnique.mockResolvedValue(null);

      await expect(service.inactivar('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.cliente.update).not.toHaveBeenCalled();
    });
  });
});
