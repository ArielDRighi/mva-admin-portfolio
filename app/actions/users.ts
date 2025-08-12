"use server";

import {
  createAuthHeaders,
  handleApiResponse,
  createServerAction,
} from "@/lib/actions";

/**
 * Obtiene los usuarios del sistema con paginación y búsqueda opcional
 */
export const getUsers = createServerAction(
  async (page: number = 1, limit: number = 15, search: string = "") => {
    const headers = await createAuthHeaders();
    const searchQuery = search ? `&search=${search}` : "";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users?page=${page}&limit=${limit}${searchQuery}`,
      {
        headers,
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener usuarios");
  },
  "Error al obtener usuarios"
);

/**
 * Obtiene un usuario específico por su ID
 * @returns La información completa del usuario con el ID especificado
 */
export const getUserById = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`,
    {
      headers,
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener usuario");
}, "Error al obtener usuario");

/**
 * Crea un nuevo usuario en el sistema
 */
export const createUser = createServerAction(
  async (userData: {
    nombre: string;
    email: string;
    password: string;
    roles: string[];
    empleadoId?: number;
  }) => {
    const headers = await createAuthHeaders();

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(userData),
    });

    return handleApiResponse(res, "Error al crear usuario");
  },
  "Error al crear usuario"
);

/**
 * Actualiza información de un usuario existente
 */
export const updateUser = createServerAction(
  async (
    id: number,
    userData: {
      email?: string;
      password?: string;
      roles?: string[];
      empleadoId?: number;
    }
  ) => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(userData),
      }
    );

    return handleApiResponse(res, "Error al actualizar usuario");
  },
  "Error al actualizar usuario"
);

/**
 * Cambia el estado de un usuario (activo/inactivo)
 */
export const changeUserStatus = createServerAction(
  async (id: number, estado: "ACTIVO" | "INACTIVO") => {
    const headers = await createAuthHeaders();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/status`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
      }
    );

    return handleApiResponse(res, "Error al cambiar estado del usuario");
  },
  "Error al cambiar estado del usuario"
);

/**
 * Elimina un usuario del sistema
 * @param id ID del usuario a eliminar
 * @returns Un objeto con información sobre el resultado de la eliminación
 */
export const deleteUser = createServerAction(async (id: number) => {
  const headers = await createAuthHeaders();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`,
    {
      method: "DELETE",
      headers,
    }
  );

  // Procesamos la respuesta correctamente - si no hay contenido, handleApiResponse devolverá un objeto vacío
  const result = await handleApiResponse<{
    success?: boolean;
    message?: string;
  }>(res, "Error al eliminar usuario");

  // Devolvemos el resultado o un objeto con éxito por defecto
  return result.success !== undefined ? result : { success: true };
}, "Error al eliminar usuario");
