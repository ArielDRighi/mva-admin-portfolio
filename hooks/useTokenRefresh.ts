import { useEffect } from "react";
import { isTokenExpiring, refreshAuthToken } from "@/lib/tokenUtils";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";

/**
 * Hook personalizado para verificar y refrescar el token de autenticación periódicamente
 * @param intervalMinutes - Intervalo en minutos para verificar el token (por defecto 5 minutos)
 */
export function useTokenRefresh(intervalMinutes = 5) {
  const router = useRouter();

  useEffect(() => {
    // Verificar el token inmediatamente al cargar el componente
    const checkToken = async () => {
      const token = getCookie("token") as string | undefined;

      if (!token) {
        console.log("No hay token, redirigiendo a login");
        router.push("/login");
        return;
      }

      if (isTokenExpiring(token)) {
        console.log("Token por expirar, intentando refrescar");
        const refreshed = await refreshAuthToken();

        if (!refreshed) {
          console.error("No se pudo refrescar el token, redirigiendo a login");
          router.push("/login");
        } else {
          console.log("Token refrescado correctamente");
        }
      }
    };

    // Verificar el token inmediatamente
    checkToken();

    // Configurar verificación periódica
    const intervalMs = intervalMinutes * 60 * 1000;
    const interval = setInterval(checkToken, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMinutes]);
}

export default useTokenRefresh;
