import { ListadoServiciosComponent } from "@/components/sections/listadoInstalacionComponent";
import React from "react";

export default async function ListadoServiciosPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoServiciosComponent />
      </div>
    </main>
  );
}
