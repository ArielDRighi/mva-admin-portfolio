"use client";

import { useEffect, useState } from "react";
import TallesEmpleadosComponent from "@/components/sections/TallesEmpleadosComponent";
import { getTallesEmpleados } from "@/app/actions/clothing";
import Loader from "@/components/ui/local/Loader";
import { RopaTalles } from "@/types/types";

// Este componente es solo un contenedor cliente que maneja la carga de datos
export default function ClientListadoTallesDeEmpleadosPage() {
  const [data, setData] = useState<{
    data: RopaTalles[];
    total: number;
    page: number;
    itemsPerPage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const result = await getTallesEmpleados();
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error("Error al cargar los talles de empleados:", err);
        if (isMounted) {
          setError("Error al cargar los datos. Por favor, intenta de nuevo.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Retrasar la carga de datos ligeramente para evitar problemas de hidratación
    const timer = setTimeout(() => {
      loadData();
    }, 10);

    // Limpieza para evitar actualizaciones de estado en componentes desmontados
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="text-red-500 text-center">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="text-center">
          <p>No se encontraron datos</p>
        </div>
      </div>
    );
  }

  return (
    <TallesEmpleadosComponent
      data={data.data}
      totalItems={data.total}
      currentPage={data.page}
      itemsPerPage={data.itemsPerPage}
    />
  );
}
