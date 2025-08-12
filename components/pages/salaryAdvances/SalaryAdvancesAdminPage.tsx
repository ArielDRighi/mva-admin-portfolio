import { getAllAdvancesAction } from "@/app/actions/salaryAdvanceActions";
import ListadoSalaryAdvancesAdminComponent from "@/components/sections/ListadoSalaryAdvancesAdminComponent";
import { SalaryAdvanceListResponse } from "@/types/salaryAdvanceTypes";
import React from "react";

export default async function SalaryAdvancesAdminPage() {
  const advances = (await getAllAdvancesAction()) as SalaryAdvanceListResponse;
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoSalaryAdvancesAdminComponent
          data={advances.advances}
          totalItems={advances.total}
          currentPage={advances.page}
          itemsPerPage={advances.limit}
        />
      </div>
    </main>
  );
};
