import { LucideIcon } from "lucide-react";

export type NavMainItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

export type VehicleMaintenance = {
  id: number;
  vehiculoId: number;
  fechaMantenimiento: string | Date;
  tipoMantenimiento: string;
  descripcion?: string;
  costo: number;
  proximoMantenimiento?: string | Date;
  completado: boolean;
  fechaCompletado?: string | Date;
  vehicle?: {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    numeroInterno: number;
  };
};

export type CreateEmployeeLeaveDto = {
  employeeId: number;
  fechaInicio: string;
  fechaFin: string;
  tipoLicencia: LeaveType;
  notas: string;
};

export class UpdateEmployeeLeaveDto {
  employeeId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  tipoLicencia?: LeaveType;
  notas?: string;
}

export enum LeaveType {
  VACACIONES = "VACACIONES",
  ENFERMEDAD = "ENFERMEDAD",
  FALLECIMIENTO_FAMILIAR = "FALLECIMIENTO_FAMILIAR",
  CASAMIENTO = "CASAMIENTO",
  NACIMIENTO = "NACIMIENTO",
}

export type UpdateVehicleMaintenance = {
  fechaMantenimiento?: string | Date;
  tipoMantenimiento?: string;
  descripcion?: string;
  costo?: number;
  proximoMantenimiento?: string | Date;
};

export type CreateVehicleMaintenance = {
  vehiculoId: number;
  fechaMantenimiento: string | Date;
  tipoMantenimiento: string;
  descripcion?: string;
  costo: number;
  proximoMantenimiento?: string | Date;
};

export type Vehiculo = {
  id: number;
  numeroInterno: string | null;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoCabina: string;
  fechaVencimientoVTV: string | null;
  fechaVencimientoSeguro: string | null;
  esExterno: boolean;
  estado:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "MANTENIMIENTO"
    | "INACTIVO"
    | "BAJA"
    | string;
  capacidadCarga?: number;
};

export type UpdateVehiculo = {
  numeroInterno?: string | null;
  placa?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  tipoCabina?: string;
  fechaVencimientoVTV?: string | null;
  fechaVencimientoSeguro?: string | null;
  esExterno?: boolean;
  estado?:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "MANTENIMIENTO"
    | "INACTIVO"
    | "BAJA"
    | string;
  capacidadCarga?: number;
};

export type CreateVehiculo = {
  numeroInterno?: string | null;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoCabina: string;
  fechaVencimientoVTV?: string | null;
  fechaVencimientoSeguro?: string | null;
  esExterno: boolean;
  estado?:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "MANTENIMIENTO"
    | "INACTIVO"
    | "BAJA"
    | string;
  capacidadCarga?: number;
};

export type VehiculoStatus = {
  estado:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "MANTENIMIENTO"
    | "INACTIVO"
    | "BAJA"
    | string;
};

export type CreateEmployee = {
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
  direccion?: string;
  fecha_nacimiento?: string;
  fecha_contratacion: string;
  cargo: string;
  estado?:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "VACACIONES"
    | "LICENCIA"
    | "INACTIVO"
    | "BAJA"
    | string;
};

export type UpdateEmployee = {
  nombre?: string;
  apellido?: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  fecha_contratacion?: string;
  cargo?: string;
  estado?:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "VACACIONES"
    | "LICENCIA"
    | "INACTIVO"
    | "BAJA"
    | string;
};

export type EmpleadoFormulario = {
  nombre: string;
  apellido: string;
  documento: string;
  fecha_nacimiento: string;
  direccion: string;
  telefono: string;
  email: string;
  cargo: string;
  estado: StatusEmployee;
  numero_legajo: number;
  cuil: string;
  cbu: string;
};

export type StatusEmployee = {
  estado:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "VACACIONES"
    | "LICENCIA"
    | "INACTIVO"
    | "BAJA"
    | string;
};

export type Empleado = {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
  direccion?: string;
  fecha_nacimiento?: string | Date;
  fecha_contratacion: string | Date;
  cargo: string;
  numero_legajo: number;
  cuil: string;
  cbu: string;
  estado:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "VACACIONES"
    | "LICENCIA"
    | "INACTIVO"
    | "BAJA"
    | string;
};

export type Cliente = {
  clienteId?: number;
  nombre: string;
  cuit: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto_principal: string;
  contacto_principal_telefono?: string;
  contactoObra1?: string;
  contacto_obra1_telefono?: string;
  contactoObra2?: string;
  contacto_obra2_telefono?: string;
  fecha_registro?: string;
  estado: "ACTIVO" | "INACTIVO" | string;
};

export type ClientesResponse = {
  items: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ClienteFormulario = Pick<
  Cliente,
  | "nombre"
  | "cuit"
  | "direccion"
  | "telefono"
  | "email"
  | "contacto_principal"
  | "contacto_principal_telefono"
  | "contactoObra1"
  | "contacto_obra1_telefono"
  | "contactoObra2"
  | "contacto_obra2_telefono"
  | "estado"
>;

export type Sanitario = {
  baño_id?: string;
  codigo_interno: string;
  modelo: string;
  fecha_adquisicion: string;
  estado:
    | "DISPONIBLE"
    | "ASIGNADO"
    | "MANTENIMIENTO"
    | "FUERA_DE_SERVICIO"
    | "BAJA"
    | string;
};

export type SanitariosResponse = {
  items: Sanitario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SanitarioFormulario = Pick<
  Sanitario,
  "codigo_interno" | "modelo" | "fecha_adquisicion" | "estado"
>;

export type MantenimientoSanitario = {
  baño_id?: number;
  mantenimiento_id?: number;
  fecha_mantenimiento?: string;
  tipo_mantenimiento: "Preventivo" | "Correctivo" | string;
  descripcion: string;
  empleado_id: string | number; // Support both string (legacy) and number (employee ID)
  costo?: number; // Made optional
  completado?: boolean;
  fechaCompletado?: string | null;
  toilet?: Sanitario;
};

export type MantenimientoSanitarioForm = {
  baño_id: number;
  mantenimiento_id?: number;
  fecha_mantenimiento?: string;
  tipo_mantenimiento: "Preventivo" | "Correctivo" | string;
  descripcion: string;
  empleado_id: number; // Employee ID for form
  costo?: number; // Made optional
  completado?: boolean;
  fechaCompletado?: string | null;
  toilet?: Sanitario;
};

export type MantenimientosSanitariosResponse = {
  data: MantenimientoSanitario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MantenimientoSanitarioFormulario = Pick<
  MantenimientoSanitario,
  "baño_id" | "tipo_mantenimiento" | "descripcion" | "empleado_id" | "costo"
>;

export type ChemicalToilet = {
  baño_id: number;
  codigo_interno: string;
  modelo: string;
  fecha_adquisicion: string;
  estado: string;
};

export interface User {
  id: number;
  nombre: string;
  email: string;
  password?: string;
  estado: "ACTIVO" | "INACTIVO";
  roles: Role[];
  empleadoId?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Roles de usuario disponibles en el sistema
 * - ADMIN: Acceso completo a todas las funcionalidades
 * - SUPERVISOR: Monitoreo y gestión de operaciones sin acceso administrativo
 * - OPERARIO: Acceso limitado a operaciones específicas
 */
export enum Role {
  ADMIN = "ADMIN",
  SUPERVISOR = "SUPERVISOR",
  OPERARIO = "OPERARIO",
}

export interface RopaTalles {
  id: number;
  empleado: {
    id: number;
    nombre: string;
    apellido: string;
  };
  calzado_talle: string;
  pantalon_talle: string;
  camisa_talle: string;
  campera_bigNort_talle: string;
  pielBigNort_talle: string;
  medias_talle: string;
  pantalon_termico_bigNort_talle: string;
  campera_polar_bigNort_talle: string;
  mameluco_talle: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tipo para manejar errores provenientes del backend
 */
export type ApiError = {
  message: string;
  error: string;
  statusCode: number;
};
