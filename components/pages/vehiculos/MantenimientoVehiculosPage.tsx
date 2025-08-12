import React from "react";
import MantenimientoVehiculosComponent from "@/components/sections/MantenimientoVehiculosComponent";

export default function MantenimientoVehiculosPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <MantenimientoVehiculosComponent
          data={[]}
          totalItems={0}
          currentPage={1}
          itemsPerPage={15}
        />
      </div>
    </main>
  );
}
