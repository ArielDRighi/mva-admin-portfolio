import React from "react";
import ListadoVehiculosPage from "@/components/pages/vehiculos/ListadoVehiculosPage";

// Forzar renderizado dinámico para evitar errores con cookies
export const dynamic = 'force-dynamic';

const ListadoVehiculos = () => {
  return <ListadoVehiculosPage />;
};

export default ListadoVehiculos;
