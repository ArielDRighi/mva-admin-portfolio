import ListadoUsuariosPage from "@/components/pages/usuarios/ListadoUsuariosPage";
import React from "react";

// Forzar renderizado dinámico para evitar errores con cookies
export const dynamic = 'force-dynamic';

const ListadoUsuarios = () => {
  return <ListadoUsuariosPage />;
};

export default ListadoUsuarios;
