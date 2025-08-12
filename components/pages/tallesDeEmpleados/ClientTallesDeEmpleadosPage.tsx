"use client";

import { ClientsImg } from "@/assets/ImgDatabase";
import { InfoCard } from "@/components/ui/local/InfoCard";
import React from "react";

const ClientTallesDeEmpleadosPage = () => {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0 items-center justify-center">
      <section className="max-w-4xl mx-auto mt-12 px-4 space-y-4">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Talles De Empleados
        </h2>
        <InfoCard
          href="/admin/dashboard/talles-de-empleados/listado"
          imgSrc={ClientsImg}
          imgAlt="Icono de talles de empleados"
          title="Gestión de Talles De Empleados"
          description="Agregá, editá o eliminá fácilmente tus talles de empleados desde esta sección."
        />
      </section>
    </main>
  );
};

export default ClientTallesDeEmpleadosPage;
