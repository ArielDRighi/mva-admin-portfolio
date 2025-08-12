"use server";

import { UpdateServiceDto, ServiceState } from "@/types/serviceTypes";
import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene una lista paginada de servicios con posibilidad de filtrado
 */
export const getServices = createServerAction(
  async (page: number = 1, limit: number = 10, search: string = "") => {
    const headers = await createAuthHeaders();

    const queryParams = new URLSearchParams();
    // Solo agregar el parámetro search si existe
    if (search) queryParams.append("search", search);

    console.log("api/services?" + queryParams.toString());
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener los servicios");
  },
  "Error al obtener los servicios"
);

/**
 * Obtiene un servicio específico por su ID
 */
export const getServiceById = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, `Error al obtener el servicio con ID ${id}`);
}, "Error al obtener el servicio");

/**
 * Obtiene servicios filtrados por un rango de fechas
 */
export const getServicesByDateRange = createServerAction(
  async (startDate: string, endDate: string) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/date-range?startDate=${startDate}&endDate=${endDate}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener servicios por rango de fechas"
    );
  },
  "Error al obtener servicios por rango de fechas"
);

/**
 * Obtiene los servicios programados para hoy
 */
export const getTodayServices = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/today`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener servicios de hoy");
}, "Error al obtener servicios de hoy");

/**
 * Obtiene servicios en estado SUSPENDIDO
 */
export const getPendingServices = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/pending`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener servicios suspendidos");
}, "Error al obtener servicios suspendidos");

/**
 * Obtiene servicios en estado EN_PROGRESO
 */
export const getInProgressServices = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/in-progress`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener servicios en progreso");
}, "Error al obtener servicios en progreso");

/**
 * Obtiene los baños instalados para un cliente específico
 */
export const getClientInstalledToilets = createServerAction(
  async (clientId: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chemical_toilets/by-client/${clientId}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      `Error al obtener baños instalados para el cliente ${clientId}`
    );
  },
  "Error al obtener baños instalados para el cliente"
);

/**
 * Actualiza un servicio existente
 */
export const updateService = createServerAction(
  async (id: number, data: UpdateServiceDto) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al actualizar el servicio");
  },
  "Error al actualizar el servicio"
);

/**
 * Cambia el estado de un servicio
 */
export const changeServiceStatus = createServerAction(
  async (id: number, estado: ServiceState) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}/estado`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al cambiar el estado del servicio");
  },
  "Error al cambiar el estado del servicio"
);

/**
 * Elimina un servicio específico
 */
export const deleteService = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al eliminar el servicio");
}, "Error al eliminar el servicio");

/**
 * Obtiene los servicios próximos a realizar
 */
export const getProximosServices = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/proximos`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener los servicios proximos");
}, "Error al obtener los servicios próximos");

/**
 * Obtiene estadísticas de los servicios
 */
export const getServicesStats = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/stats`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(
    res,
    "Error al obtener las estadisticas de servicios"
  );
}, "Error al obtener las estadísticas de servicios");

/**
 * Obtiene el resumen de servicios
 */
export const getResumeServices = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/resumen`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener el resumen de servicios");
}, "Error al obtener el resumen de servicios");

/**
 * Obtiene las limpiezas futuras programadas con paginación
 */
export const getFuturesCleanings = createServerAction(
  async (page: number = 1, limit: number = 10) => {
    const headers = await createAuthHeaders();

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/future_cleanings?${queryParams.toString()}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener limpiezas futuras");
  },
  "Error al obtener limpiezas futuras"
);

/**
 * Obtiene la actividad reciente global
 */
export const getRecentActivity = createServerAction(async () => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/recent_activity/global`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener actividades recientes");
}, "Error al obtener actividades recientes");

enum serviceStatus {
  EN_PROGRESO = "EN_PROGRESO",
  COMPLETADO = "COMPLETADO",
  CANCELADO = "CANCELADO",
  SUSPENDIDO = "SUSPENDIDO",
}

/**
 * Actualiza el estado de un servicio
 */
export const updateStatusService = createServerAction(
  async (id: number, estado: serviceStatus) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}/estado`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al cambiar el estado del servicio");
  },
  "Error al cambiar el estado del servicio"
);

// UTILIZAMOS TODO DE ACA PARA ABAJO
export interface CreateCapacitacionDto {
  tipoServicio: "CAPACITACION";
  fechaProgramada: string;
  fechaFin: string;
  ubicacion: string;
  asignacionesManual: {
    empleadoId: number;
  }[];
}

/**
 * Crea un servicio de capacitación
 */
export const createServiceCapacitacion = createServerAction(
  async (data: CreateCapacitacionDto) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/capacitacion`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al crear el servicio de capacitacion");
  },
  "Error al crear el servicio de capacitación"
);

/**
 * Obtiene todas las capacitaciones
 */
/**
 * Obtiene todas las capacitaciones con paginación y búsqueda
 */
export const getCapacitaciones = createServerAction(
  async (page: number = 1, limit: number = 10, search: string = "") => {
    const headers = await createAuthHeaders();

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());
    if (search) queryParams.append("search", search);

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/services/capacitacion?${queryParams.toString()}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener capacitaciones");
  },
  "Error al obtener capacitaciones"
);

export interface CreateInstalacionDto {
  condicionContractualId: number;
  fechaProgramada: string;
  cantidadVehiculos: number;
  ubicacion: string;
  asignacionAutomatica: boolean;
  asignacionesManual: [
    {
      empleadoId?: number;
      vehiculoId: number;
      banosIds: number[];
      rol: string;
    },
    {
      empleadoId?: number;
      rol: string;
    }
  ];
  notas?: string;
}

/**
 * Crea un servicio de instalación
 */
export const createServiceInstalacion = createServerAction(
  async (data: CreateInstalacionDto) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/instalacion`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al crear el servicio de instalación");
  },
  "Error al crear el servicio de instalación"
);

/**
 * Obtiene las instalaciones con paginación
 */
export const getInstalaciones = createServerAction(async (page: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/services/instalacion?page=${page}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener instalaciones");
}, "Error al obtener instalaciones");

export interface CreateLimpiezaDto {
  tipoServicio: "LIMPIEZA";
  condicionContractualId: number;
  cantidadVehiculos: number;
  fechaProgramada: string;
  ubicacion: string;
  asignacionAutomatica: boolean;
  banosInstalados: number[];
  asignacionesManual: [
    {
      empleadoId: number;
      vehiculoId: number;
      rol: string;
    },
    {
      empleadoId: number;
      rol: string;
    }
  ];
  notas?: string;
}

/**
 * Crea un servicio genérico (usado principalmente para limpiezas)
 */
export const createServicioGenerico = createServerAction(
  async (data: CreateLimpiezaDto) => {
    console.log("[createServicioGenerico] Starting with data:", data);
    const headers = await createAuthHeaders();

    console.log("[createServicioGenerico] Token found, making API request");
    console.log(
      "[createServicioGenerico] API URL:",
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/generico`
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/generico`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(data),
          cache: "no-store",
        }
      );

      console.log("[createServicioGenerico] Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[createServicioGenerico] Error response:", errorText);
        throw new Error(`Error al crear el servicio generico: ${errorText}`);
      }

      const responseData = await res.json();
      console.log("[createServicioGenerico] Success response:", responseData);
      return responseData;
    } catch (error) {
      console.error("[createServicioGenerico] Exception:", error);
      throw error;
    }
  },
  "Error al crear el servicio genérico"
);

/**
 * Obtiene los servicios genéricos con paginación
 */
export const getServiciosGenericos = createServerAction(
  async (page: number) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/services/generico?page=${page}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener servicios genericos");
  },
  "Error al obtener servicios genéricos"
);

/**
 * Obtiene limpiezas futuras por rango de fechas con paginación
 */
export const getFutureCleaningsByDateRange = createServerAction(
  async (
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const headers = await createAuthHeaders();

    const queryParams = new URLSearchParams();
    queryParams.append("startDate", startDate);
    queryParams.append("endDate", endDate);
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/future_cleanings/by-date-range?${queryParams.toString()}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener limpiezas futuras por rango de fechas"
    );
  },
  "Error al obtener limpiezas futuras por rango de fechas"
);

/**
 * Obtiene limpiezas futuras próximas con filtro de días
 */
export const getUpcomingFutureCleanings = createServerAction(
  async (days: number = 7, page: number = 1, limit: number = 10) => {
    const headers = await createAuthHeaders();

    const queryParams = new URLSearchParams();
    queryParams.append("days", days.toString());
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/future_cleanings/upcoming?${queryParams.toString()}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(
      res,
      "Error al obtener limpiezas futuras próximas"
    );
  },
  "Error al obtener limpiezas futuras próximas"
);

/**
 * Obtiene una limpieza futura específica por su ID
 */
export const getFutureCleaningById = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/future_cleanings/${id}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(
    res,
    `Error al obtener la limpieza futura con ID ${id}`
  );
}, "Error al obtener la limpieza futura");

/**
 * Crea una nueva limpieza futura manualmente
 */
export const createFutureCleaning = createServerAction(
  async (data: {
    servicioId: number;
    fechaProgramada: string;
    estado?: string;
    notas?: string;
  }) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/future_cleanings`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al crear la limpieza futura");
  },
  "Error al crear la limpieza futura"
);

/**
 * Modifica una limpieza futura (activar/desactivar)
 */
export const modifyFutureCleaning = createServerAction(
  async (
    id: number,
    data: {
      fechaProgramada?: string;
      estado?: string;
      notas?: string;
    }
  ) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/future_cleanings/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al modificar la limpieza futura");
  },
  "Error al modificar la limpieza futura"
);

/**
 * Elimina una limpieza futura
 */
export const deleteFutureCleaning = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/future_cleanings/${id}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al eliminar la limpieza futura");
}, "Error al eliminar la limpieza futura");

export interface CreateRetiroDto {
  clienteId: number;
  fechaProgramada: string;
  tipoServicio: "RETIRO";
  cantidadBanos: number;
  cantidadVehiculos: number;
  ubicacion: string;
  notas?: string;
  asignacionAutomatica: boolean;
  banosInstalados: number[];
  condicionContractualId: number;
  asignacionesManual: [
    {
      empleadoId: number;
      vehiculoId: number;
    },
    {
      empleadoId: number;
    }
  ];
}

/**
 * Crea un servicio de retiro
 */
export const createServicioRetiro = createServerAction(
  async (data: CreateRetiroDto) => {
    const headers = await createAuthHeaders();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/generico`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(data),
          cache: "no-store",
        }
      );

      console.log("[createServicioRetiro] Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[createServicioRetiro] Error response:", errorText);
        throw new Error(`Error al crear el servicio de retiro: ${errorText}`);
      }

      const responseData = await res.json();
      console.log("[createServicioRetiro] Success response:", responseData);
      return responseData;
    } catch (error) {
      console.error("[createServicioRetiro] Exception:", error);
      throw error;
    }
  },
  "Error al crear el servicio de retiro"
);

/**
 * Obtiene los servicios de retiro con paginación
 */
export const getServiciosRetiro = createServerAction(
  async (page: number = 1, limit: number = 10) => {
    const headers = await createAuthHeaders();

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/services/retiro?${queryParams.toString()}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener servicios de retiro");
  },
  "Error al obtener servicios de retiro"
);
