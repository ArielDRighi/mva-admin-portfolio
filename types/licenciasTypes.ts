import { Empleado, LeaveType } from "./types";

// Primero actualizo LicenciaEmpleado para que coincida con la estructura del JSON
export interface LicenciaEmpleado {
  id: number;
  employee: {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
    telefono: string;
    email: string;
    direccion: string | null;
    fecha_nacimiento: string | null;
    fecha_contratacion: string;
    cargo: string;
    estado: string;
    numero_legajo: number | null;
    cuil: string | null;
    cbu: string | null;
    diasVacacionesTotal?: number;
    diasVacacionesRestantes?: number;
    diasVacacionesUsados?: number;
  };
  empleado?: Empleado;  // Mantengo esta propiedad por compatibilidad con código existente
  employeeId: number;
  fechaInicio: string;
  fechaFin: string;
  tipoLicencia: string;
  notas: string;
  comentarioRechazo: string | null;
  aprobado: boolean;
  observaciones?: string; // Mantengo por compatibilidad con código existente
  createdAt?: string;     // Mantengo por compatibilidad con código existente
  updatedAt?: string;     // Mantengo por compatibilidad con código existente
}

// Ahora actualizo la interfaz LicenciasEmpleadosResponse
export interface LicenciasEmpleadosResponse {
  data: LicenciaEmpleado[];
  totalItems: number;
  currentPage: number;
  itemsPerPage?: number;
}

// El resto de interfaces se mantienen igual
export interface EmployeeLeave {
  id: number;
  employee_id?: number;
  employeeId?: number;
  employee?: Empleado;
  start_date?: string | Date;
  end_date?: string | Date;
  fechaInicio?: string | Date;
  fechaFin?: string | Date;
  type?: LeaveType;
  tipoLicencia?: LeaveType;
  observations?: string;
  reason?: string;
  notas?: string;
  status?: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  aprobado?: boolean;
  // Permitir acceso a propiedad employee.nombre para búsqueda
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface EmployeeLeavesResponse {
  data?: EmployeeLeave[];
  items?: EmployeeLeave[];
  totalItems?: number;
  total?: number;
  currentPage?: number;
  page?: number;
  limit?: number;
}

export interface LicenciaFormData {
  employeeId: number;
  fechaInicio: string;
  fechaFin: string;
  tipoLicencia: LeaveType;
}