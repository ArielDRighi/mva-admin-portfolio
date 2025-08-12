import ListadoCondicionesContractualesPage from "@/components/pages/condicionesContractuales/ListadoCondicionesContractuales";
import React from "react";

// Forzar renderizado dinámico para evitar errores con cookies
export const dynamic = 'force-dynamic';

const CondicionesContractualesListado = () => {
  return <ListadoCondicionesContractualesPage />;
};

export default CondicionesContractualesListado;
