"use client";

import { getVehicles, getVehicleById } from "@/app/actions/vehiculos";
import { Vehiculo } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { SearchSelector } from "../SearchSelector";
import { Calendar, CheckCircle, Truck } from "lucide-react";
import { toast } from "sonner";

interface VehiculoSelectorProps {
  value: number;
  onChange: (vehiculoId: number) => void;
  label: string;
  name: string;
  error?: string;
  disabled?: boolean;
}

export function VehiculoSelector({
  value,
  onChange,
  label,
  name,
  error,
  disabled = false,
}: VehiculoSelectorProps) {  const searchVehiculos = async (term: string) => {
    try {
      console.log("Buscando vehículos con término:", term);
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL); // Para depurar

      // Si hay un término de búsqueda, usamos la API para filtrar
      const result = await getVehicles(1, 20, term);
      console.log("Resultado de búsqueda:", result);      // Usar type assertion específica en lugar de any
      type VehiculosResponse = { data: Vehiculo[] };
      const data = (result as unknown as VehiculosResponse).data || [];
      
      // Ya no filtramos los vehículos en mantenimiento para permitir seleccionarlos en la pantalla de mantenimientos
      console.log("Vehículos encontrados:", data);
      return data;
    } catch (error) {
      console.error("Error al buscar vehículos:", error);

      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = "Intente nuevamente o contacte al administrador.";

      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      // Devolver array vacío en caso de error para evitar que se rompa la UI
      toast.error("No se pudieron cargar los vehículos", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });
      return [];
    }
  };
  const getVehiculoById = async (id: number): Promise<Vehiculo> => {
    try {
      const vehiculo = await getVehicleById(id);
      return vehiculo as Vehiculo;
    } catch (error) {
      console.error(`Error al cargar el vehículo con ID ${id}:`, error);

      // Extraer el mensaje de error para mostrar información más precisa
      let errorMessage = `No se pudo cargar el vehículo con ID ${id}`;

      // Si es un error con mensaje personalizado, lo usamos
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }

      // Mostrar toast con el error
      toast.error("Error al cargar vehículo", {
        description: errorMessage,
        duration: 5000, // Duración aumentada para mejor visibilidad
      });

      // Devolvemos un objeto vehículo con datos mínimos para evitar errores en la UI
      return {
        id: id,
        placa: `ID: ${id}`,
        marca: "Error al cargar",
        modelo: "",
        anio: 0,
        tipoCabina: "",
        estado: "NO_DISPONIBLE",
      } as Vehiculo;
    }
  };

  return (
    <SearchSelector<Vehiculo>
      value={value}
      onChange={onChange}
      label={label}
      name={name}
      error={error}
      disabled={disabled}
      placeholder="Buscar por placa o número interno"
      searchFn={searchVehiculos}
      getItemById={getVehiculoById}
      minSearchLength={2}
      renderSelected={(vehiculo) => (
        <div className="flex flex-1 items-center justify-between">
          <div className="flex flex-col">
            <span className="font-medium">
              {vehiculo.placa}{" "}
              {vehiculo.numeroInterno && `(#${vehiculo.numeroInterno})`}
            </span>
            <span className="text-sm text-gray-500">
              {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio}) -{" "}
              {vehiculo.tipoCabina}
            </span>
          </div>
          <Badge
            variant={vehiculo.estado === "DISPONIBLE" ? "default" : "outline"}
          >
            {vehiculo.estado}
          </Badge>
        </div>
      )}
      renderItem={(vehiculo, handleSelect) => (
        <div
          key={vehiculo.id}
          className="p-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
          onClick={() => handleSelect(vehiculo)}
        >
          <div>
            <div className="font-medium flex items-center">
              <Truck className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {vehiculo.placa}{" "}
              {vehiculo.numeroInterno && `(#${vehiculo.numeroInterno})`}
            </div>
            <div className="text-sm text-gray-600">
              {vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio}) -{" "}
              {vehiculo.tipoCabina}
            </div>
            {(vehiculo.fechaVencimientoVTV ||
              vehiculo.fechaVencimientoSeguro) && (
              <div className="text-xs text-gray-500 flex gap-2 mt-1">
                {vehiculo.fechaVencimientoVTV && (
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    VTV:{" "}
                    {new Date(vehiculo.fechaVencimientoVTV).toLocaleDateString(
                      "es-AR"
                    )}
                  </span>
                )}
                {vehiculo.fechaVencimientoSeguro && (
                  <span className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Seguro:{" "}
                    {new Date(
                      vehiculo.fechaVencimientoSeguro
                    ).toLocaleDateString("es-AR")}
                  </span>
                )}
              </div>
            )}
          </div>
          <Badge
            variant={vehiculo.estado === "DISPONIBLE" ? "default" : "outline"}
          >
            {vehiculo.estado}
          </Badge>
        </div>
      )}
    />
  );
}
