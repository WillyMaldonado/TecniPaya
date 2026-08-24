export interface Client {
  nit: string;
  nombre: string;
  telefono: string;
  contacto: string;
  saldoPendiente: number;
}

export interface Supplier {
  id: string;
  nombre: string;
}

export interface License {
  id: string;
  nombreLicencia: string;
}

export interface LaptopData {
  codigoInventario: string;
  marca: string;
  modelo: string;
  tieneMaletin: boolean;
  tieneCargador: boolean;
  estado: 'DISPONIBLE' | 'PRESTADA' | 'EN_REPARACION' | 'BAJA';
  proveedorId?: string;
  proveedor?: Supplier;
  licencias?: License[];
}

export interface LoanLaptop {
  codigoInventario: string;
  laptop: {
    marca: string;
    modelo: string;
  };
}

export interface LoanItem {
  id: string;
  fechaEntrega: string;
  estado: 'ACTIVO' | 'FINALIZADO';
  laptops: LoanLaptop[];
}
