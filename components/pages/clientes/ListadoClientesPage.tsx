export const dynamic = "force-dynamic";
import React from "react";
import { getClients } from "@/app/actions/clientes";
import ListadoClientesComponent from "@/components/sections/ListadoClientesComponent";
import { ClientesResponse } from "@/types/types";

export default async function ListadoClientesPage() {
  const clients = await getClients() as ClientesResponse;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoClientesComponent
          data={clients.items}
          totalItems={clients.total}
          currentPage={clients.page}
          itemsPerPage={clients.limit}
        />
      </div>
    </main>
  );
}
