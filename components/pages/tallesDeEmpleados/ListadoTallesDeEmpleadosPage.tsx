"use client";

import { useState, useEffect } from "react";
import { getTallesEmpleados } from "@/lib/apiClient";
import TallesEmpleadosComponent from "@/components/sections/TallesEmpleadosComponent";
import Loader from "@/components/ui/local/Loader";
import { RopaTalles } from "@/types/types";

export default function ListadoTallesDeEmpleadosPage() {
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
  }, []); // Efecto para cargar datos después del montaje
  useEffect(() => {
    if (!isMounted) return;

    // Usamos una variable para controlar montaje/desmontaje
    let isActive = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar si el componente sigue montado antes de continuar
        if (!isActive) return;

        // Llamar a la API directamente
        const result = await getTallesEmpleados(1, 10, "");

        // Verificar nuevamente el estado de montaje antes de actualizar estados
        if (isActive) {
          if (result) {
            // Manejar diferentes formatos de respuesta
            if ("data" in result && Array.isArray(result.data)) {
              setData(result.data);
              setTotalItems(result.totalItems || result.data.length);
              setCurrentPage(result.currentPage || 1);
              setItemsPerPage(result.itemsPerPage || 10);
            } else if ("items" in result && Array.isArray(result.items)) {
              setData(result.items);
              setTotalItems(result.total || result.items.length);
              setCurrentPage(result.page || 1);
              setItemsPerPage(result.limit || 10);
            } else {
              setData([]);
              setTotalItems(0);
            }
          } else {
            setData([]);
            setTotalItems(0);
          }
        }
      } catch (err) {
        console.error("Error al cargar los talles de empleados:", err);
        if (isActive) {
          setError(err instanceof Error ? err.message : "Error al cargar los datos. Por favor, intenta de nuevo.");
          setData([]);
          setTotalItems(0);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    // Limpieza al desmontar el componente
    return () => {
      isActive = false;
    };
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
