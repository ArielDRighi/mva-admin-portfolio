export const dynamic = "force-dynamic";
import React from "react";
import ListadoUsuariosComponent from "@/components/sections/ListadoUsuariosComponent";
import { getUsers } from "@/app/actions/users";
import { UsersResponse } from "@/types/userTypes";

export default async function ListadoUsuariosPage() {
  // Obtener parámetros de búsqueda desde la URL
  const page = 1; // Por defecto página 1
  const itemsPerPage = 10;
  const search = "";
  
  const response = await getUsers(page, itemsPerPage, search) as UsersResponse;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoUsuariosComponent
          data={response.data}
          totalItems={response.totalItems}
          currentPage={response.currentPage}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </main>
  );
}
