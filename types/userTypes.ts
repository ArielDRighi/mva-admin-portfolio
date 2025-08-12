// Tipos relacionados con la gestión de usuarios

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

/**
 * Interfaz que define la estructura de un usuario en el sistema
 */
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
 * Datos para la creación de un nuevo usuario
 */
export interface CreateUserData {
  nombre: string;
  email: string;
  password: string;
  roles: string[];
  empleadoId?: number;
}

/**
 * Datos para la actualización de un usuario existente
 */
export interface UpdateUserData {
  email?: string;
  password?: string;
  roles?: string[];
  empleadoId?: number;
}

/**
 * Respuesta paginada de la API para usuarios
 */
export interface UsersResponse {
  data: User[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
}

export interface ByIDUserResponse {
  id: number;
  user: User;
  nombre: string;
  email: string;
  password: string;
  estado: "ACTIVO" | "INACTIVO";
  roles: string[];
  empleadoId: number;
}