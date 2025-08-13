"use client";

import { useEffect, useState } from "react";
import { getSalaryAdvances } from "@/lib/apiClient";
import ListadoSalaryAdvancesAdminComponent from "@/components/sections/ListadoSalaryAdvancesAdminComponent";
import { SalaryAdvanceListResponse, SalaryAdvance } from "@/types/salaryAdvanceTypes";
import React from "react";

export default function SalaryAdvancesAdminPage() {
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdvances = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getSalaryAdvances();

        if (result && typeof result === "object") {
          const response = result as SalaryAdvanceListResponse;
          setAdvances(response.advances || []);
          setTotalItems(response.total || 0);
          setCurrentPage(response.page || 1);
          setItemsPerPage(response.limit || 10);
        } else {
          setAdvances([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error fetching advances:", error);
        setError(error instanceof Error ? error.message : "Error cargando adelantos");
        setAdvances([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvances();
  }, []);

  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Cargando adelantos...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center p-8">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <ListadoSalaryAdvancesAdminComponent
          data={advances}
          totalItems={totalItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </main>
  );
}
