"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/ui/local/Loader";
import { getTallesEmpleados } from "@/app/actions/clothing";
import { RopaTalles } from "@/types/types";
import TallesEmpleadosComponent from "@/components/sections/TallesEmpleadosComponent";

export default function ClientSideTallesEmpleados() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RopaTalles[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMounted, setIsMounted] = useState(false);

  // Efecto para controlar el montaje en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Efecto separado para cargar datos después de que el componente esté montado
  useEffect(() => {
    if (!isMounted) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Añadimos un pequeño retardo para evitar problemas de hidratación
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const result = await getTallesEmpleados();
        
        if (result && Array.isArray(result.data)) {
          setData(result.data);
          setTotalItems(result.total || 0);
          setCurrentPage(result.page || 1);
          setItemsPerPage(result.itemsPerPage || 10);
        } else {
          setError("No se pudieron cargar los datos");
        }
      } catch (err) {
        console.error("Error al cargar los talles:", err);
        setError("Ocurrió un error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isMounted]);

  if (!isMounted || loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="text-red-500 text-center p-4 border border-red-300 rounded-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <TallesEmpleadosComponent 
      data={data}
      totalItems={totalItems}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
    />
  );
}
