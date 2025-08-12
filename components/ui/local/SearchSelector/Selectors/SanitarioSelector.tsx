"use client";

import { getToiletsList } from "@/app/actions/sanitarios";
import { Sanitario } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { SearchSelector } from "../SearchSelector";
import { Bath, CalendarClock, Hash } from "lucide-react";
import { toast } from "sonner";

interface SanitarioSelectorProps {
  value: number;
  onChange: (sanitarioId: number) => void;
  label: string;
  name: string;
  error?: string;
  disabled?: boolean;
}

export function SanitarioSelector({
  value,
  onChange,
  label,
  name,
  error,
  disabled = false,
}: SanitarioSelectorProps) {  const searchSanitarios = async (term: string) => {
    try {
      console.log("Buscando sanitarios con término:", term);
      
      // Obtener todos los sanitarios
      const allToilets = await getToiletsList();
      
      // Filtrar sanitarios que están en mantenimiento o de baja
      const filteredSanitarios = allToilets.filter((sanitario: Sanitario) => {
        // Estado válido: no está en mantenimiento ni de baja
        const validState =
          sanitario.estado !== "MANTENIMIENTO" &&
          sanitario.estado !== "MANTENIMIENTO" &&
          sanitario.estado !== "BAJA";
          
        // Si no hay término de búsqueda o es muy corto, solo validamos por estado
        if (!term || term.length < 2) return validState;
        
        // Si hay término, filtramos por coincidencia además del estado
        const matchesTerm =
          sanitario.codigo_interno?.toLowerCase().includes(term.toLowerCase()) ||
          sanitario.modelo?.toLowerCase().includes(term.toLowerCase());
          
        return validState && matchesTerm;
      });
      
      console.log("Sanitarios filtrados:", filteredSanitarios.length);
      
      // Mapear para asegurar que todos tengan un ID numérico
      const mappedSanitarios = filteredSanitarios.map(
        (sanitario: Sanitario) => ({
          ...sanitario,
          id: parseInt(sanitario.baño_id || "0"),
        })
      );

      return mappedSanitarios;    } catch (error) {
      console.error("Error al buscar sanitarios:", error);
      
      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "Intente nuevamente o contacte al administrador.";
      
      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      // Mostrar toast con el error
      toast.error("No se pudieron cargar los sanitarios", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
      
      return [];
    }
  };  const getSanitarioById = async (id: number) => {
    try {
      const allToilets = await getToiletsList();

      const sanitario = allToilets.find(
        (s: Sanitario) => parseInt(s.baño_id || "0") === id
      );

      if (!sanitario) {
        return {
          baño_id: id.toString(),
          codigo_interno: `ID: ${id}`,
          modelo: "Desconocido",
          fecha_adquisicion: new Date().toISOString(),
          estado: "DISPONIBLE",
          id: id,
        };
      }

      return {
        ...sanitario,
        id: parseInt(sanitario.baño_id || "0"),
      };    } catch (error) {
      console.error(`Error al cargar el sanitario con ID ${id}:`, error);
      
      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = `No se pudo cargar el sanitario con ID ${id}`;
      
      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      // Mostrar toast con el error
      toast.error("Error al cargar sanitario", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
      
      return {
        baño_id: id.toString(),
        codigo_interno: `ID: ${id}`,
        modelo: "Error al cargar",
        fecha_adquisicion: new Date().toISOString(),
        estado: "DISPONIBLE",
        id: id,
      };
    }
  };
  return (
    <SearchSelector<Sanitario & { id: number }>
      value={value}
      onChange={onChange}
      label={label}
      name={name}
      error={error}
      disabled={disabled}
      placeholder="Buscar por código interno"
      searchFn={searchSanitarios}
      getItemById={getSanitarioById}
      minSearchLength={2}
      renderSelected={(sanitario) => (
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium">
              {sanitario.codigo_interno && `#${sanitario.codigo_interno}`}
            </span>
            <span className="text-sm text-gray-500">
              {sanitario.modelo} - Adquirido:{" "}
              {new Date(sanitario.fecha_adquisicion).toLocaleDateString(
                "es-AR"
              )}
            </span>
          </div>
          <Badge
            variant={sanitario.estado === "DISPONIBLE" ? "default" : "outline"}
          >
            {sanitario.estado}
          </Badge>
        </div>
      )}
      renderItem={(sanitario, handleSelect) => (
        <div
          key={sanitario.id}
          className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
          onClick={() => handleSelect(sanitario)}
        >
          <div>
            <div className="font-medium flex items-center">
              <Bath className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <span className="flex items-center">
                <Hash className="h-3 w-3 mr-1" />
                {sanitario.codigo_interno}
              </span>
            </div>
            <div className="text-sm text-gray-600">{sanitario.modelo}</div>
            <div className="text-xs text-gray-500 flex gap-2 mt-1">
              <span className="flex items-center">
                <CalendarClock className="h-3 w-3 mr-1" />
                Adquirido:{" "}
                {new Date(sanitario.fecha_adquisicion).toLocaleDateString(
                  "es-AR"
                )}
              </span>
            </div>
          </div>
          <Badge
            variant={sanitario.estado === "DISPONIBLE" ? "default" : "outline"}
          >
            {sanitario.estado}
          </Badge>
        </div>
      )}
    />
  );
}
