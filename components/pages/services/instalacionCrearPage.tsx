import CrearInstalacionComponent from "@/components/sections/instalacionCrearComponent";
import React from "react";

export default async function CrearInstalacionPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <CrearInstalacionComponent />
      </div>
    </main>
  );
}
