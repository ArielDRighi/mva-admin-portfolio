"use server";

import { CreateEmployeeLeaveDto, UpdateEmployeeLeaveDto } from "@/types/types";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";
import { LicenciasEmpleadosResponse } from "@/types/licenciasTypes";

/**
 * Obtiene todas las licencias (vacaciones, licencias médicas, etc.) de los empleados
 * @returns Una respuesta paginada con las licencias de los empleados
 */
export const getEmployeeLeaves = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();

    // Procesamos el término de búsqueda para el API
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse<LicenciasEmpleadosResponse>(
      res,
      "Error al obtener las licencias de los empleados"
    );
  },
  "Error al obtener las licencias de los empleados"
);

/**
 * Get a specific employee leave by ID
 */
export const getEmployeeLeaveById = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/${id}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener la licencia");
}, "Error al obtener la licencia");

/**
 * Get all leaves for a specific employee with optional pagination and search
 */
export const getLeavesByEmployee = createServerAction(
  async (
    employeeId: number,
    page: number = 1,
    limit: number = 15,
    search: string = ""
  ) => {
    const headers = await createAuthHeaders();

    // Procesamos el término de búsqueda para el API
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";
    const paginationQuery = `?page=${page}&limit=${limit}`;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/employee/${employeeId}${paginationQuery}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener licencias del empleado");
  },
  "Error al obtener licencias del empleado"
);

/**
 * Create a new employee leave
 */
export const createEmployeeLeave = createServerAction(
  async (data: CreateEmployeeLeaveDto) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al crear la licencia");
  },
  "Error al crear la licencia"
);

/**
 * Update an existing employee leave
 */
export const updateEmployeeLeave = createServerAction(
  async (id: number, data: UpdateEmployeeLeaveDto) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/${id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al actualizar la licencia");
  },
  "Error al actualizar la licencia"
);

/**
 * Approve an employee leave request
 */
export const approveEmployeeLeave = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/${id}/approve`,
    {
      method: "PATCH",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al aprobar la licencia");
}, "Error al aprobar la licencia");

/**
 * Delete an employee leave
 */
export const deleteEmployeeLeave = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/${id}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al eliminar la licencia");
}, "Error al eliminar la licencia");

/**
 * Reject an employee leave request
 */
export const rejectEmployeeLeave = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/${id}/reject`,
    {
      method: "PATCH",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al rechazar la licencia");
}, "Error al rechazar la licencia");

/**
 * Get all leaves for a specific user with pagination and search support
 */
export const getLicenciasByUserId = createServerAction(
  async (
    userId: number,
    page: number = 1,
    limit: number = 15,
    search: string = ""
  ) => {
    const headers = await createAuthHeaders();

    // Procesamos el término de búsqueda para el API
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";
    const paginationQuery = `?page=${page}&limit=${limit}`;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employee-leaves/employee/${userId}${paginationQuery}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener licencias del empleado");
  },
  "Error al obtener licencias del empleado"
);
