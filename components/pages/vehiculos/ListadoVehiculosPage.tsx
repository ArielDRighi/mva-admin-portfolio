import React from "react";
import ListadoVehiculosComponent from "@/components/sections/ListadoVehiculosComponent";
import { getVehicles } from "@/app/actions/vehiculos";
import { Vehiculo } from "@/types/types";

interface VehicleResponse {
  data: Vehiculo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export default async function ListadoVehiculosPage() {
  const vehicles = (await getVehicles()) as VehicleResponse;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoVehiculosComponent
          data={vehicles.data}
          totalItems={vehicles.totalItems}
          currentPage={vehicles.currentPage}
          itemsPerPage={vehicles.itemsPerPage}
        />
      </div>
    </main>
  );
}
