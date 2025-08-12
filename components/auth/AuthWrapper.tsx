"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getCookie, deleteCookie } from "cookies-next";
import { isTokenExpiring } from "@/lib/tokenUtils";

/**
 * Componente envoltorio para autenticación que verifica la presencia y validez del token
 * y renderiza los children una vez que la autenticación está lista
 */
export default function AuthWrapper({ children }: PropsWithChildren) {
  const router = useRouter();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthValid, setIsAuthValid] = useState(false);

  // Efecto para verificar la autenticación
  useEffect(() => {
    const verifyAuth = () => {
      // Verificar si hay un token
      const token = getCookie("token");
      
      if (!token) {
        console.error("No hay token de autenticación");
        // Redirigir al login sin mostrar toast (lo mostrará la página de login)
        router.push("/login?expired=true");
        return false;
      }
      
      // Verificar si el token es válido (no expirado)
      if (isTokenExpiring(token as string)) {
        console.error("Token expirado o a punto de expirar");
        
        // Limpiar cookies
        deleteCookie("token");
        deleteCookie("user");
        
        // Mostrar notificación y redirigir
        toast.error("Sesión expirada", {
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente",
          duration: 4000,
        });
        
        router.push("/login?expired=true");
        return false;
      }
      
      // Si llegamos aquí, el token es válido
      return true;
    };
    
    // Verificar autenticación y actualizar estado
    const isValid = verifyAuth();
    setIsAuthValid(isValid);
    setIsAuthReady(true);
  }, [router]);

  // Si la autenticación no está lista, mostrar nada
  if (!isAuthReady) {
    return null;
  }
  
  // Si la autenticación no es válida, no renderizar los children
  if (!isAuthValid) {
    return null;
  }

  // Si la autenticación está lista y es válida, renderizar los children
  return <>{children}</>;
}
