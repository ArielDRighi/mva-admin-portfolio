import { getMyAdvancesAction } from "@/app/actions/salaryAdvanceActions";
import ListadoSalaryAdvancesEmpleadosComponent from "@/components/sections/ListadoSalaryAdvancesEmpleadosComponent";
import { cookies } from "next/headers";
import { SalaryAdvance } from "@/types/salaryAdvanceTypes";
import React from "react";

const SalaryAdvancesEmpleadosPage = async () => {
  // Obtener el token de las cookies del servidor
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  // Pasar el token a getMyAdvancesAction
  const advances = (await getMyAdvancesAction(token)) as SalaryAdvance[];
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <ListadoSalaryAdvancesEmpleadosComponent 
        data={advances}
      />
    </main>
  );
};

export default SalaryAdvancesEmpleadosPage;
