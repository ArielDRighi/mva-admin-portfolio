export enum ServiceType {
  INSTALACION = "INSTALACION",
  RETIRO = "RETIRO",
  LIMPIEZA = "LIMPIEZA",
  REEMPLAZO = "REEMPLAZO",
  TRASLADO = "TRASLADO",
  MANTENIMIENTO_IN_SITU = "MANTENIMIENTO_IN_SITU",
  REPARACION = "REPARACION",
}

export enum ServiceState {
  PROGRAMADO = "PROGRAMADO",
  EN_PROGRESO = "EN_PROGRESO",
  COMPLETADO = "COMPLETADO",
  CANCELADO = "CANCELADO",
  SUSPENDIDO = "SUSPENDIDO",
}

export interface ResourceAssignment {
  id: number;
  servicioId: number;
  empleadoId: number;
  empleado?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  vehiculoId: number;
  vehiculo?: {
    id: number;
    patente: string;
    modelo: string;
  };
  banoId?: number;
  bano?: {
    id: number;
    numero_serie: string;
  };
  fechaAsignacion: Date;
}

export interface FuturaLimpieza {
  id: number;
  servicioId: number;
  fechaProgramada: Date;
  estado: string;
}

export interface Service {
  id: number;
  clienteId: number;
  cliente?: {
    clienteId: number;
    nombre: string;
    email: string;
  };
  fechaProgramada: Date;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  tipoServicio: ServiceType;
  estado: ServiceState;
  cantidadBanos: number;
  cantidadEmpleados: number;
  cantidadVehiculos: number;
  ubicacion: string;
  notas: string | null;
  asignacionAutomatica: boolean;
  banosInstalados: number[] | null;
  condicionContractualId: number | null;
  fechaFinAsignacion: Date | null;
  fechaCreacion: Date;
  asignaciones: ResourceAssignment[];
  futurasLimpiezas: FuturaLimpieza[];
}

export type CreateServiceDtoAutomatico = {
  // Campos obligatorios
  clienteId: number;
  fechaProgramada: Date | string; // Soporte para ambos formatos
  tipoServicio: ServiceType; // Usar enum en lugar de string
  cantidadBanos: number;
  cantidadEmpleados: number;
  cantidadVehiculos: number;
  ubicacion: string;

  // Campos opcionales
  fechaInicio?: string;
  fechaFin?: string;
  estado?: ServiceState; // Usar enum en lugar de string
  notas?: string;
  condicionContractualId?: number;
  fechaFinAsignacion?: string;

  // Campos específicos según tipoServicio
  banosInstalados?: number[]; // Para servicios LIMPIEZA, RETIRO, etc.
};

// Tipo para las asignaciones manuales
export type ManualAssignment = {
  empleadoId: number; // ID del empleado (obligatorio)
  vehiculoId?: number; // ID del vehículo (opcional)
  banosIds?: number[]; // IDs de los baños (opcional)
};

export type CreateServiceDtoManual = {
  // Campos obligatorios
  clienteId: number;
  fechaProgramada: Date | string;
  tipoServicio: ServiceType;
  cantidadBanos: number;
  cantidadEmpleados: number;
  cantidadVehiculos: number;
  ubicacion: string;
  asignacionesManual: ManualAssignment[]; // Obligatorio para asignación manual

  // Campos opcionales
  fechaInicio?: string;
  fechaFin?: string;
  estado?: ServiceState;
  notas?: string;
  condicionContractualId?: number;
  fechaFinAsignacion?: string;

  // Campos específicos según tipoServicio
  banosInstalados?: number[]; // Obligatorio para LIMPIEZA, RETIRO, etc.
};

export type ResourceAssignmentDto = {
  empleadoId?: number;
  vehiculoId?: number;
  banosIds?: number[];
  search?: string;
};

export type UpdateServiceDto = {
  clienteId?: number;
  fechaProgramada?: string;
  fechaInicio?: string;
  fechaFin?: string;
  tipoServicio?: ServiceType;
  estado?: ServiceState;
  cantidadBanos?: number;
  cantidadEmpleados?: number;
  condicionContractualId?: number;
  cantidadVehiculos?: number;
  ubicacion?: string;
  notas?: string;
  asignacionAutomatica?: boolean;
  asignacionesManual?: ResourceAssignmentDto[];
  banosInstalados?: number[];
};

export type ChangeServiceStatusDto = {
  estado: ServiceState;
  forzar?: boolean;
};

export type FilterServicesDto = {
  search?: string;
  estado?: ServiceState;
  tipoServicio?: ServiceType;
  clienteId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
};

export type TipoServicio =
  | "INSTALACION"
  | "MANTENIMIENTO"
  | "RETIRO"
  | "LIMPIEZA";

export type EstadoServicio =
  | "PROGRAMADO"
  | "EN_PROGRESO"
  | "COMPLETADO"
  | "CANCELADO"
  | "PENDIENTE";

export interface Cliente {
  clienteId: number;
  nombre: string;
  email: string;
  cuit: string;
  direccion: string;
  // Otros campos del cliente
}

export interface Asignacion {
  // Definir propiedades de asignaciones según necesidad
  id: number;
  // Otros campos relevantes
}

export interface BanoInstalado {
  // Definir propiedades de baños instalados según necesidad
  id: number;
  baño_id?: string;
  codigo_interno: string;
  modelo: string;
  fecha_adquisicion?: string;
  estado?: string;
  // Otros campos relevantes
}

export interface Servicio {
  id: number;
  clienteId: number;
  cliente: Cliente;
  tipoServicio: TipoServicio;
  estado: EstadoServicio;
  ubicacion: string;
  fechaCreacion: string;
  fechaProgramada: string;
  fechaInicio: string;
  fechaFin: string;
  fechaFinAsignacion: string;
  cantidadBanos: number;
  cantidadEmpleados: number;
  cantidadVehiculos: number;
  asignacionAutomatica: boolean;
  empleadoAId: number | null;
  empleadoBId: number | null;
  condicionContractualId: number;
  notas: string;
  comentarioIncompleto: string | null;
  asignaciones: Asignacion[];
  banosInstalados: BanoInstalado[];
}

export type ProximosServicios = Servicio[];
