import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    const existente = await this.prisma.proveedor.findFirst({
      where: {
        nombre: { equals: dto.nombre, mode: 'insensitive' },
      },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un proveedor registrado con el nombre ${dto.nombre}`,
      );
    }
    return this.prisma.proveedor.create({ data: dto });
  }

  findAll(soloActivos = true) {
    return this.prisma.proveedor.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const proveedor = await this.prisma.proveedor.findUnique({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }
    return proveedor;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }

  async inactivar(id: string) {
    await this.findOne(id);
    return this.prisma.proveedor.update({
      where: { id },
      data: { activo: false },
    });
  }
}
