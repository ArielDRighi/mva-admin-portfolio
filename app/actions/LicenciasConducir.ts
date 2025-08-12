"use server";

import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene la licencia de conducir de un empleado específico
 */
export const getLicenciaByEmpleadoId = createServerAction(
  async (empleadoId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/licencia/${empleadoId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener licencias de conducir");
  },
  "Error al obtener licencia de conducir del empleado"
);

export interface UpdateLicenciaConducir {
  categoria?: string;
  fecha_expedicion?: Date;
  fecha_vencimiento?: Date;
}

/**
 * Actualiza la licencia de conducir de un empleado
 */
export const updateLicenciaConducir = createServerAction(
  async (empleadoId: number, licencia: UpdateLicenciaConducir) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/licencia/update/${empleadoId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(licencia),
      }
    );

    return handleApiResponse(res, "Error al actualizar licencia de conducir");
  },
  "Error al actualizar licencia de conducir del empleado"
);

export interface CreateLicenciaConducir {
  categoria: string;
  fecha_expedicion: Date;
  fecha_vencimiento: Date;
}

/**
 * Crea una nueva licencia de conducir para un empleado
 */
export const createLicenciaConducir = createServerAction(
  async (empleadoId: number, licencia: CreateLicenciaConducir) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/licencia/${empleadoId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(licencia),
      }
    );

    return handleApiResponse(res, "Error al crear licencia de conducir");
  },
  "Error al crear licencia de conducir para el empleado"
);

/**
 * Obtiene las licencias próximas a vencer en un determinado número de días
 * con soporte para paginación y búsqueda
 * @returns {LicenciasConducirResponse} Datos de licencias próximas a vencer
 */
export const getLicenciasToExpire = createServerAction(
  async (
    dias: number,
    page: number = 1,
    limit: number = 15,
    search: string = ""
  ) => {
    const headers = await createAuthHeaders();

    // Procesamos el término de búsqueda para el API
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/licencias/por-vencer?dias=${dias}&page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener licencias próximas a vencer"
    );
  },
  "Error al obtener licencias próximas a vencer"
);

/**
 * Obtiene un listado paginado de todas las licencias de conducir con posibilidad de búsqueda
 * @returns {LicenciasConducirResponse} Datos de licencias de conducir
 */
export const getLicenciasConducir = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();

    // Procesamos el término de búsqueda para el API
    const searchQuery = search ? `&search=${encodeURIComponent(search)}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/employees/licencias?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener licencias de conducir");
  },
  "Error al obtener listado de licencias de conducir"
);
