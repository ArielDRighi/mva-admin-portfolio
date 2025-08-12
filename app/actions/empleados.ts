"use server";

import { CreateEmployee, UpdateEmployee } from "@/types/types";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene una lista paginada de empleados con posibilidad de filtrado
 */
export const getEmployees = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();

    // Procesamos el término de búsqueda para el API
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";

    // Llamada al API con el término de búsqueda
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener empleados");
  },
  "Error al obtener los empleados"
);

/**
 * Obtiene un empleado específico por su ID
 */
export const getEmployeeById = createServerAction(async (id: string) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employees/${id}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener el empleado");
}, `Error al obtener el empleado`);

/**
 * Obtiene un empleado por su número de documento
 */
export const getEmployeeByDocumento = createServerAction(
  async (documento: string) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/documento/${documento}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener el empleado por documento");
  },
  "Error al obtener el empleado por documento"
);

/**
 * Edita la información de un empleado
 */
export const editEmployee = createServerAction(
  async (id: number, data: UpdateEmployee) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al editar el empleado");
  },
  "Error al editar el empleado"
);

/**
 * Elimina un empleado
 */
export const deleteEmployee = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employees/${id}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al eliminar el empleado");
}, "Error al eliminar el empleado");

/**
 * Crea un nuevo empleado
 */
export const createEmployee = createServerAction(
  async (data: CreateEmployee) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al crear el empleado");
  },
  "Error al crear el empleado"
);

/**
 * Cambia el estado de un empleado
 */
export const changeEmployeeStatus = createServerAction(
  async (id: number, estado: string) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/${id}/estado`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al cambiar el estado del empleado");
  },
  "Error al cambiar el estado del empleado"
);

/**
 * Obtiene el total de empleados
 */
export const getTotalEmployees = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/employees/total_employees`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener el total de empleados");
}, "Error al obtener el total de empleados");

/**
 * Obtiene los servicios pendientes asignados a un empleado
 */
export const getMineAssignedServicesPending = createServerAction(
  async (employeeId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/assigned/pendings/${employeeId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener los servicios asignados pendientes"
    );
  },
  "Error al obtener los servicios pendientes asignados al empleado"
);

/**
 * Obtiene los servicios en progreso asignados a un empleado
 */
export const getMineAssignedServicesInProgress = createServerAction(
  async (employeeId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/assigned/inProgress/${employeeId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener los servicios asignados en progreso"
    );
  },
  "Error al obtener los servicios en progreso asignados al empleado"
);

/**
 * Obtiene los últimos servicios de un empleado
 */
export const getLastServicesByUserId = createServerAction(
  async (employeeId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/employee/${employeeId}/last`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener los últimos servicios");
  },
  "Error al obtener los últimos servicios del empleado"
);

/**
 * Obtiene los servicios completados por un empleado
 */
export const getCompletedServicesByEmployee = createServerAction(
  async (
    employeeId: number,
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    const headers = await createAuthHeaders();
    const searchQuery = search ? `&search=${search}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/employee/${employeeId}/completed?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener los servicios completados del empleado"
    );
  },
  "Error al obtener los servicios completados del empleado"
);

/**
 * Obtiene los próximos servicios asignados a un empleado específico
 */
export const getProximosServiciosPorEmpleado = createServerAction(
  async (employeeId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/proximos-servicios`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener los próximos servicios del empleado"
    );
  },
  "Error al obtener los próximos servicios del empleado"
);
