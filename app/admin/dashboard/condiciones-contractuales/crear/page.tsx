import CrearCondicionContractualesPage from "@/components/pages/condicionesContractuales/CrearCondicionContractualPage";
import AccessDeniedComponent from "@/components/sections/AccessDeniedComponent";
import { cookies } from "next/headers";
import React from "react";

const CrearCondicionesContractuales = async () => {
  // Verificar el rol del usuario
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user")?.value;
  
  if (userCookie) {
    const user = JSON.parse(userCookie);
    
    // Si es supervisor, mostrar página de acceso denegado
    if (user.roles.includes("SUPERVISOR") && !user.roles.includes("ADMIN")) {
      return <AccessDeniedComponent />;
    }
  }
  
  // Si es admin o no está autenticado (se maneja en middleware), mostrar la página normal
  return <CrearCondicionContractualesPage />;
};

export default CrearCondicionesContractuales;
