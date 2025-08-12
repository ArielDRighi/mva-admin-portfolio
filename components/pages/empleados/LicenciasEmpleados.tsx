export const dynamic = "force-dynamic";
import React from "react";
import { getEmployeeLeaves } from "@/app/actions/LicenciasEmpleados";
import LicenciasEmpleadosComponent from "@/components/sections/LicenciasEmpleadosComponent";
import { LicenciasEmpleadosResponse } from "@/types/licenciasTypes";

export default async function LicenciasEmpleadosPage() {
  const licencias = await getEmployeeLeaves() as LicenciasEmpleadosResponse;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <LicenciasEmpleadosComponent
          data={licencias.data}
          totalItems={licencias.totalItems}
          currentPage={licencias.currentPage}
          itemsPerPage={15}
        />
      </div>
    </main>
  );
}