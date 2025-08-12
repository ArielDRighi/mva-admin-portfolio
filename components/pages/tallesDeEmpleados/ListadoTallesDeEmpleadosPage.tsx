"use client";

import { useState, useEffect } from "react";
import { getTallesEmpleados } from "@/app/actions/clothing";
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
  }, []);  // Efecto para cargar datos después del montaje
  useEffect(() => {
    if (!isMounted) return;
    
    // Usamos una variable para controlar montaje/desmontaje
    let isActive = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        // Pequeño retardo para evitar problemas de hidratación
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verificar si el componente sigue montado antes de continuar
        if (!isActive) return;
          // Usamos revalidación para asegurarnos de obtener datos frescos
        const result = await getTallesEmpleados(undefined, undefined, "", { revalidate: true });
        
        // Verificar nuevamente el estado de montaje antes de actualizar estados
        if (isActive) {
          // Usamos una función callback para actualizar el estado para evitar race conditions
          setData(prev => {
            // Solo actualizamos si realmente hay cambios
            const hasChanges = JSON.stringify(prev) !== JSON.stringify(result.data);
            return hasChanges ? result.data : prev;
          });
          setTotalItems(result.total);
          setCurrentPage(result.page);
          setItemsPerPage(result.itemsPerPage);
        }
      } catch (err) {
        console.error("Error al cargar los talles de empleados:", err);
        if (isActive) {
          setError("Error al cargar los datos. Por favor, intenta de nuevo.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    // Establecemos un intervalo para refrescar los datos periódicamente si la página está visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && isActive) {
        loadData();
      }
    }, 30000); // Refrescar cada 30 segundos si la página está visible
    
    // Limpieza al desmontar el componente
    return () => {
      isActive = false;
      clearInterval(intervalId);
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
