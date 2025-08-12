export const dynamic = "force-dynamic";
import React from "react";

import { getLicenciasConducir } from "@/app/actions/LicenciasConducir";
import ListadoLicenciasConducirComponent from "@/components/sections/ListadoLicenciasConducirComponent";
import { LicenciasConducirResponse } from "@/types/licenciasConducirTypes";

export default async function ListadoLicenciasConducirPage() {
  const licenciasConducir = await getLicenciasConducir() as LicenciasConducirResponse;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoLicenciasConducirComponent
          data={licenciasConducir.data}
          totalItems={licenciasConducir.totalItems}
          currentPage={licenciasConducir.currentPage}
          itemsPerPage={15}
        />
      </div>
    </main>
  );
}
