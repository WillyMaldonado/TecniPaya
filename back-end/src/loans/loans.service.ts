import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { EstadoLaptop, EstadoPrestamo } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  calcularCostoPrestamo(
    fechaEntrega: Date,
    fechaDevolucion: Date,
    cantidadLaptops: number,
  ): number {
    if (fechaDevolucion < fechaEntrega) {
      throw new BadRequestException(
        'La fecha de devolución no puede ser anterior a la fecha de entrega',
      );
    }

    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    const diferenciaMilisegundos =
      fechaDevolucion.getTime() - fechaEntrega.getTime();

    let dias = Math.ceil(diferenciaMilisegundos / milisegundosPorDia);

    if (dias === 0) {
      dias = 1;
    }

    return dias * 100 * cantidadLaptops;
  }

  async create(dto: CreateLoanDto) {
    const fechaEntrega = new Date(dto.fechaEntrega);
    const fechaDevolucionEstimada = new Date(dto.fechaDevolucionEstimada);

    // Solo validamos que el estimado tenga sentido (RN-05); no se persiste
    // todavía. El costo y la fecha real de devolución se calculan y guardan
    // hasta que el préstamo se cierra (ver cerrarPrestamo).
    if (fechaDevolucionEstimada < fechaEntrega) {
      throw new BadRequestException(
        'La fecha de devolución estimada no puede ser anterior a la fecha de entrega',
      );
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { nit: dto.clienteId },
    });

    if (!cliente || !cliente.activo) {
      throw new NotFoundException(
        'El cliente especificado no existe o está inactivo',
      );
    }

    const laptops = await this.prisma.altaLaptops.findMany({
      where: { codigoInventario: { in: dto.laptopIds } },
    });

    if (laptops.length !== dto.laptopIds.length) {
      throw new NotFoundException(
        'Una o más laptops especificadas no existen en inventario',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Actualización atómica: solo marca como PRESTADA las laptops que en
      // este mismo instante siguen DISPONIBLE. Si otra petición concurrente
      // ya tomó alguna, el conteo no va a coincidir y hacemos rollback.
      // Esto cierra la condición de carrera de RN-04 (una laptop no puede
      // quedar en dos préstamos activos a la vez).
      const actualizacion = await tx.altaLaptops.updateMany({
        where: {
          codigoInventario: { in: dto.laptopIds },
          estado: EstadoLaptop.DISPONIBLE,
        },
        data: { estado: EstadoLaptop.PRESTADA },
      });

      if (actualizacion.count !== dto.laptopIds.length) {
        throw new ConflictException(
          'Una o más laptops ya no están disponibles (fueron tomadas por otro préstamo, enviadas a reparación, o dadas de baja)',
        );
      }

      return tx.prestamo.create({
        data: {
          cliente: { connect: { nit: dto.clienteId } },
          fechaEntrega,
          estado: EstadoPrestamo.ACTIVO,
          // costo y fechaDevolucion quedan null: se calculan al cerrar
          laptops: {
            create: dto.laptopIds.map((codigo) => ({
              codigoInventario: codigo,
            })),
          },
        },
        include: { laptops: true },
      });
    });
  }

  async findAll(filtros?: {
    clienteNit?: string;
    laptopCodigo?: string;
    estado?: EstadoPrestamo;
  }) {
    if (
      filtros?.estado &&
      !Object.values(EstadoPrestamo).includes(filtros.estado)
    ) {
      throw new BadRequestException(
        `Estado '${filtros.estado}' no es válido. Valores permitidos: ${Object.values(EstadoPrestamo).join(', ')}`,
      );
    }

    return this.prisma.prestamo.findMany({
      where: {
        ...(filtros?.clienteNit ? { nit: filtros.clienteNit } : {}),
        ...(filtros?.laptopCodigo
          ? { laptops: { some: { codigoInventario: filtros.laptopCodigo } } }
          : {}),
        ...(filtros?.estado ? { estado: filtros.estado } : {}),
      },
      include: {
        cliente: true,
        laptops: { include: { laptop: true } },
      },
      orderBy: { fechaEntrega: 'desc' },
    });
  }

  async findOne(id: string) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: {
        cliente: true,
        laptops: {
          include: { laptop: true },
        },
      },
    });

    if (!prestamo) {
      throw new NotFoundException(`El préstamo con ID ${id} no fue encontrado`);
    }

    return prestamo;
  }

  async cerrarPrestamo(id: string) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { id },
      include: { laptops: true },
    });

    if (!prestamo) {
      throw new NotFoundException(`El préstamo con ID ${id} no fue encontrado`);
    }

    if (prestamo.estado !== EstadoPrestamo.ACTIVO) {
      throw new BadRequestException('El préstamo ya fue finalizado');
    }

    const fechaRealDevolucion = new Date();
    const costoFinal = this.calcularCostoPrestamo(
      prestamo.fechaEntrega,
      fechaRealDevolucion,
      prestamo.laptops.length,
    );

    const laptopIds = prestamo.laptops.map((l) => l.codigoInventario);

    return this.prisma.$transaction(async (tx) => {
      const prestamoCerrado = await tx.prestamo.update({
        where: { id },
        data: {
          fechaDevolucion: fechaRealDevolucion,
          costo: costoFinal,
          estado: EstadoPrestamo.FINALIZADO,
        },
      });

      await tx.altaLaptops.updateMany({
        where: { codigoInventario: { in: laptopIds } },
        data: { estado: EstadoLaptop.DISPONIBLE },
      });

      await tx.cliente.update({
        where: { nit: prestamo.nit },
        data: {
          saldoPendiente: { increment: costoFinal },
        },
      });

      return prestamoCerrado;
    });
  }
}
