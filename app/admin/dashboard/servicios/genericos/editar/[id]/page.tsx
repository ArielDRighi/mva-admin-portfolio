"use client";

import { EditarServicioGenericoComponent } from "@/components/sections/editarServicioGenericoComponent";
import { useParams } from "next/navigation";
import React from "react";

export default function EditarServicioGenericoPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <EditarServicioGenericoComponent id={id} />
      </div>
    </main>
  );
}
