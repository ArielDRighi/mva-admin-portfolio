"use client";

import { getEmployees, getEmployeeById } from "@/app/actions/empleados";
import { Empleado } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { SearchSelector } from "../SearchSelector";
import { Calendar, UserRound } from "lucide-react";
import { toast } from "sonner";

interface EmpleadoSelectorProps {
  value: number;
  onChange: (empleadoId: number) => void;
  label: string;
  name: string;
  error?: string;
  disabled?: boolean;
}

export function EmpleadoSelector({
  value,
  onChange,
  label,
  name,
  error,
  disabled = false,
}: EmpleadoSelectorProps) {  // Definimos una interfaz clara para la respuesta de la API
  interface EmpleadosResponse {
    data?: Empleado[];
    items?: Empleado[];
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
  }
  
  const searchEmpleados = async (term: string): Promise<Empleado[]> => {
    try {
      console.log("Buscando empleados con término:", term);
      
      // Obtenemos 15 resultados para mostrar más opciones
      // Tipamos explícitamente la respuesta para mayor seguridad
      const result = await getEmployees(1, 15, term) as EmpleadosResponse;
      
      // Validamos que la respuesta tenga la estructura esperada
      if (result && typeof result === 'object') {
        // Accedemos a los datos con la estructura tipada
        const items = result.data || result.items || [];
        
        // Filtrar solo empleados disponibles (no en licencia, de baja, etc.)
        const filteredItems = items.filter(emp => 
          emp.estado === "DISPONIBLE" || emp.estado === "ASIGNADO"
        );
        
        console.log("Empleados filtrados:", filteredItems.length);
        return filteredItems;
      }
      return [];
    } catch (error) {
      console.error("Error al buscar empleados:", error);
      
      // Extraer el mensaje de error para mostrar información más precisa
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Intente nuevamente o contacte al administrador.";
      
      // Mostrar toast con el error usando el formato consistente
      toast.error("No se pudieron cargar los empleados", {
        description: errorMessage,
        duration: 5000
      });
      
      return [];
    }
  };const getEmpleadoById = async (id: number): Promise<Empleado> => {
    try {
      // Tipamos explícitamente la respuesta para mayor seguridad
      const empleado = await getEmployeeById(id.toString()) as Empleado;
      
      // Validamos que tengamos un empleado con los campos mínimos requeridos
      if (!empleado || !empleado.id) {
        throw new Error(`No se encontró el empleado con ID ${id}`);
      }
      
      return empleado;
    } catch (error) {
      console.error(`Error al cargar el empleado con ID ${id}:`, error);
      
      // Extraer el mensaje de error para mostrar información más precisa usando el patrón consistente
      const errorMessage = error instanceof Error 
        ? error.message 
        : `No se pudo cargar el empleado con ID ${id}`;
      
      // Mostrar toast con el error usando el formato consistente
      toast.error("Error al cargar empleado", {
        description: errorMessage,
        duration: 5000
      });
      
      // Devolvemos un objeto empleado con datos mínimos para evitar errores en la UI
      // Seguimos la estructura del tipo Empleado para mantener consistencia
      return {
        id: id,
        nombre: "Error al cargar",
        apellido: "",
        documento: `ID: ${id}`,
        cargo: "No disponible",
        estado: "NO_DISPONIBLE",
        fecha_contratacion: new Date().toISOString(),
        telefono: "",
        email: "",
        cuil: "",
        cbu: "",
        numero_legajo: 0
      };
    }
  };

  return (
    <SearchSelector<Empleado>
      value={value}
      onChange={onChange}
      label={label}
      name={name}
      error={error}
      disabled={disabled}
      placeholder="Buscar por nombre o documento"
      searchFn={searchEmpleados}
      getItemById={getEmpleadoById}
      minSearchLength={2}
      renderSelected={(empleado) => (
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium">
              {empleado.nombre} {empleado.apellido}{" "}
              <span className="text-gray-500">#{empleado.id}</span>
            </span>
            <span className="text-sm text-gray-500">
              {empleado.cargo} - {empleado.documento}
            </span>
          </div>
          <Badge
            variant={empleado.estado === "DISPONIBLE" ? "default" : "outline"}
          >
            {empleado.estado}
          </Badge>
        </div>
      )}
      renderItem={(empleado, handleSelect) => (
        <div
          key={empleado.id}
          className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
          onClick={() => handleSelect(empleado)}
        >
          <div>
            <div className="font-medium flex items-center">
              <UserRound className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {empleado.nombre} {empleado.apellido}{" "}
              <span className="ml-1 text-gray-500">#{empleado.id}</span>
            </div>
            <div className="text-sm text-gray-600">
              {empleado.cargo} - {empleado.documento}
            </div>
            <div className="text-xs text-gray-500 flex gap-2 mt-1">
              {empleado.fecha_contratacion && (
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Contratación:{" "}
                  {new Date(empleado.fecha_contratacion).toLocaleDateString(
                    "es-AR"
                  )}
                </span>
              )}
            </div>
          </div>
          <Badge
            variant={empleado.estado === "DISPONIBLE" ? "default" : "outline"}
          >
            {empleado.estado}
          </Badge>
        </div>
      )}
    />
  );
}
