"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteCookie, getCookie } from "cookies-next";
import { toast } from "sonner";
import { isTokenExpiring } from "@/lib/tokenUtils";

/**
 * Componente que actúa como detector global de errores 401 y expiración de tokens
 * Se debe incluir en los layouts de las secciones autenticadas
 */
export default function AuthErrorHandler() {
  const router = useRouter();

  // Efecto para verificar errores de autenticación a nivel global
  useEffect(() => {
    // Detector para interceptar respuestas 401 a nivel global
    const handleUnauthorizedResponses = () => {
      // Modificar el comportamiento original de fetch para detectar errores 401
      const originalFetch = window.fetch;
      window.fetch = async function(input, init) {
        // Realizar la petición con el fetch original
        const response = await originalFetch(input, init);
        
        // Si la respuesta es 401, redirigir al login
        if (response.status === 401) {
          console.error('Respuesta 401 detectada globalmente');
          
          // Limpiar cookies de sesión
          deleteCookie("token");
          deleteCookie("user");
          
          // Mostrar notificación
          toast.error("Sesión expirada", {
            description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            duration: 4000,
          });
          
          // Redirigir al login
          router.push("/login?expired=true");
        }
        
        return response;
      };
      
      return () => {
        // Restaurar el comportamiento original de fetch al desmontar
        window.fetch = originalFetch;
      };
    };
    
    // Comprobar periódicamente el estado del token
    const tokenCheckInterval = setInterval(() => {
      const token = getCookie("token");
      
      if (token && isTokenExpiring(token as string)) {
        console.warn("Token expirado detectado en comprobación periódica");
        
        // Limpiar cookies
        deleteCookie("token");
        deleteCookie("user");
        
        // Mostrar notificación
        toast.error("Sesión expirada", {
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          duration: 4000,
        });
        
        // Redirigir al login
        router.push("/login?expired=true");
        
        // Limpiar el intervalo
        clearInterval(tokenCheckInterval);
      }
    }, 30000); // Comprobar cada 30 segundos
    
    // Iniciar el detector de respuestas 401
    const cleanup = handleUnauthorizedResponses();
    
    return () => {
      // Limpieza al desmontar
      cleanup();
      clearInterval(tokenCheckInterval);
    };
  }, [router]);

  // Este componente no renderiza nada visible
  return null;
}
