import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLaptopDto } from './dto/create-laptop.dto';
import { UpdateLaptopDto } from './dto/update-laptop.dto';
import { BajaDefinitivaDto } from './dto/baja-definitiva.dto';
import { EnviarReparacionDto } from './dto/enviar-reparacion.dto';
import { EstadoLaptop } from '@prisma/client';

@Injectable()
export class LaptopsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLaptopDto) {
    const existe = await this.prisma.altaLaptops.findUnique({
      where: { codigoInventario: dto.codigoInventario },
    });

    if (existe) {
      throw new ConflictException(
        `La laptop con código de inventario '${dto.codigoInventario}' ya existe`,
      );
    }

    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: dto.proveedorId },
    });

    if (!proveedor) {
      throw new NotFoundException(
        `El proveedor con ID '${dto.proveedorId}' no existe`,
      );
    }

    if (!proveedor.activo) {
      throw new BadRequestException(
        `El proveedor '${proveedor.nombre}' se encuentra inactivo`,
      );
    }

    const { licencias, ...laptopData } = dto;

    return this.prisma.altaLaptops.create({
      data: {
        ...laptopData,
        estado: EstadoLaptop.DISPONIBLE,
        licencias: licencias
          ? {
              create: licencias.map((nombre) => ({
                nombreLicencia: nombre,
              })),
            }
          : undefined,
      },
      include: {
        proveedor: true,
        licencias: true,
      },
    });
  }

  findAll() {
    return this.prisma.altaLaptops.findMany({
      include: {
        proveedor: true,
        licencias: true,
      },
      orderBy: { codigoInventario: 'asc' },
    });
  }

  async findOne(codigoInventario: string) {
    const laptop = await this.prisma.altaLaptops.findUnique({
      where: { codigoInventario },
      include: {
        proveedor: true,
        licencias: true,
        reparaciones: true,
      },
    });

    if (!laptop) {
      throw new NotFoundException(
        `Laptop con código de inventario '${codigoInventario}' no encontrada`,
      );
    }

    return laptop;
  }

  async update(codigoInventario: string, dto: UpdateLaptopDto) {
    const laptop = await this.findOne(codigoInventario);

    if (laptop.estado === EstadoLaptop.BAJA_DEFINITIVA) {
      throw new BadRequestException(
        'No se puede editar una laptop dada de baja definitivamente',
      );
    }

    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findUnique({
        where: { id: dto.proveedorId },
      });

      if (!proveedor || !proveedor.activo) {
        throw new BadRequestException(
          `El proveedor con ID '${dto.proveedorId}' no es válido o está inactivo`,
        );
      }
    }

    return this.prisma.altaLaptops.update({
      where: { codigoInventario },
      data: dto,
      include: { proveedor: true, licencias: true },
    });
  }

  async darBajaDefinitiva(codigoInventario: string, dto: BajaDefinitivaDto) {
    const laptop = await this.findOne(codigoInventario);

    if (
      laptop.estado !== EstadoLaptop.DISPONIBLE &&
      laptop.estado !== EstadoLaptop.EN_REPARACION
    ) {
      throw new BadRequestException(
        `No se puede dar de baja definitiva una laptop en estado '${laptop.estado}'`,
      );
    }

    return this.prisma.altaLaptops.update({
      where: { codigoInventario },
      data: {
        estado: EstadoLaptop.BAJA_DEFINITIVA,
        fechaBaja: new Date(),
        motivoBaja: dto.motivoBaja,
      },
    });
  }

  async enviarAReparacion(codigoInventario: string, dto: EnviarReparacionDto) {
    const laptop = await this.findOne(codigoInventario);

    if (laptop.estado !== EstadoLaptop.DISPONIBLE) {
      throw new BadRequestException(
        `Solo se puede enviar a reparación una laptop DISPONIBLE (estado actual: ${laptop.estado})`,
      );
    }

    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: dto.proveedorId },
    });
    if (!proveedor || !proveedor.activo) {
      throw new BadRequestException(
        `El proveedor con ID '${dto.proveedorId}' no es válido o está inactivo`,
      );
    }

    const [, reparacion] = await this.prisma.$transaction([
      this.prisma.altaLaptops.update({
        where: { codigoInventario },
        data: { estado: EstadoLaptop.EN_REPARACION },
      }),
      this.prisma.reparacion.create({
        data: {
          codigoInventario,
          proveedorId: dto.proveedorId,
          fechaEstimadaRetorno: dto.fechaEstimadaRetorno
            ? new Date(dto.fechaEstimadaRetorno)
            : undefined,
          motivoFalla: dto.motivoFalla,
        },
      }),
    ]);

    return reparacion;
  }

  async registrarRetornoReparacion(codigoInventario: string) {
    const laptop = await this.findOne(codigoInventario);

    if (laptop.estado !== EstadoLaptop.EN_REPARACION) {
      throw new BadRequestException(
        `La laptop no está en reparación actualmente (estado: ${laptop.estado})`,
      );
    }

    const reparacionAbierta = await this.prisma.reparacion.findFirst({
      where: { codigoInventario, fechaRealRetorno: null },
      orderBy: { fechaEnvio: 'desc' },
    });

    if (!reparacionAbierta) {
      throw new NotFoundException(
        'No se encontró un registro de reparación abierto para esta laptop',
      );
    }

    const [laptopActualizada] = await this.prisma.$transaction([
      this.prisma.altaLaptops.update({
        where: { codigoInventario },
        data: { estado: EstadoLaptop.DISPONIBLE },
      }),
      this.prisma.reparacion.update({
        where: { id: reparacionAbierta.id },
        data: { fechaRealRetorno: new Date() },
      }),
    ]);

    return laptopActualizada;
  }
}