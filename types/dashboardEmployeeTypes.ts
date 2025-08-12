export enum ServiceStatus {
  EN_PROGRESO = "EN_PROGRESO",
  COMPLETADO = "COMPLETADO",
  CANCELADO = "CANCELADO",
  SUSPENDIDO = "SUSPENDIDO",
}

export interface ProximoServicio {
  id: number;
  clienteId: number;
  cliente?: {
    id: number;
    nombre: string;
  };
  fechaInicio?: string;
  fechaFin?: string;
  fechaProgramada: string;
  ubicacion: string;
  tipoServicio: string;
  estado: string;
  cantidadBanos?: number;
  cantidadEmpleados?: number;
  cantidadVehiculos?: number;
  notas?: string;
  vehiculo?: {
    id: number;
    modelo: string;
    patente?: string;
  };
}

export interface Licencia {
  id: number;
  employeeId: number;
  fechaInicio: string;
  fechaFin: string;
  tipoLicencia: string;
  notas: string;
  aprobado: boolean | null; // null = pendiente, true = aprobado, false = rechazado
  employee?: {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
    cargo: string;
    estado: string;
  };
}

export interface CompletedService {
  id: number;
  clienteId: number;
  cliente?: {
    id: number;
    nombre: string;
    cuit: string;
    direccion: string;
    email: string;
    telefono: string;
    contacto_principal: string;
    estado: string;
  };
  tipoServicio: string;
  estado: string;
  fechaCreacion: string;
  fechaProgramada: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion: string;
  notas?: string;
  cantidadBanos?: number;
  cantidadEmpleados?: number;
  cantidadVehiculos?: number;
  asignaciones?: Array<{
    id: number;
    servicioId: number;
    empleadoId: number;
    vehiculoId?: number;
    banoId?: number;
    fechaAsignacion: string;
    empleado?: {
      id: number;
      nombre: string;
      apellido: string;
      documento: string;
    };
    vehiculo?: {
      id: number;
      numeroInterno?: number;
      placa?: string;
      marca: string;
      modelo: string;
    };
    bano?: {
      baño_id: number;
      codigo_interno: string;
      modelo: string;
      fecha_adquisicion: string;
      estado: string;
    };
  }>;
  banosInstalados?: Array<{
    id: number;
    codigo: string;
    estado: string;
  }>;
}

export interface UpdateResponse {
  success?: boolean;
  message?: string;
}

export interface LeaveResponse {
  id?: number;
  success?: boolean;
  message?: string;
}
