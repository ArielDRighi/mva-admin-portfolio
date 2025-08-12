// utils/logout.ts
"use client";

import { deleteCookie } from "cookies-next";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

/**
 * Función para cerrar la sesión del usuario eliminando las cookies
 * Esta función se ejecuta en el cliente y maneja su propio esquema de errores
 *
 * @returns void
 */
export function logoutUser() {
  try {
    deleteCookie("token");
    deleteCookie("user");
  } catch (error) {
    const message =
      getErrorMessage(error) || "Ocurrió un problema al cerrar la sesión";

    console.error("Error al cerrar sesión:", error);
    toast.error("Error", {
      description: message,
    });
    throw error;
  }
}
