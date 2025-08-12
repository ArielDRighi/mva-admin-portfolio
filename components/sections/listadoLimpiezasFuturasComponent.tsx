"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/ui/local/Loader";
import { getUpcomingFutureCleanings, getFutureCleaningsByDateRange } from "@/app/actions/services";

// Types from the dashboard component
export type Cleaning = {
  id: number;
  numero_de_limpieza: number;
  fecha_de_limpieza: string;
  cliente?: {
    nombre: string;
    id: number;
  };
  servicio?: {
    id: number;
  };
};

export type CleaningsResponse = {
  items: Cleaning[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function ListadoLimpiezasFuturasComponent() {
  const [limpiezas, setLimpiezas] = useState<CleaningsResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [days, setDays] = useState(30); // Default to 30 days
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchLimpiezas = useCallback(async () => {
    try {
      setLoading(true);
      const currentPage = Number(searchParams.get("page")) || 1;
      const currentDays = Number(searchParams.get("days")) || 30;
      
      // Use the upcoming future cleanings endpoint for filtered results
      const result = await getUpcomingFutureCleanings(currentDays, currentPage, 10);
      
      if (result && typeof result === "object") {
        setLimpiezas(result as CleaningsResponse);
      }
    } catch (error) {
      console.error("Error al obtener limpiezas futuras:", error);
      toast.error("Error al cargar limpiezas", {
        description: error instanceof Error ? error.message : "Error desconocido",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLimpiezas();
  }, [fetchLimpiezas]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    
    if (days) {
      params.set("days", days.toString());
    } else {
      params.delete("days");
    }
    
    // Reset to first page when searching
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.replace(`?${params.toString()}`);
  };

  const handleRefresh = () => {
    fetchLimpiezas();
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid auto-rows-min gap-4 grid-cols-1">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Limpiezas Futuras</h1>
            <p className="text-gray-500">
              Gestiona las limpiezas programadas próximamente
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Filtros</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="days" className="text-sm font-medium">
                  Próximos días:
                </label>
                <Input
                  id="days"
                  type="number"
                  placeholder="30"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value) || 30)}
                  className="w-20"
                  min="1"
                  max="365"
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {limpiezas.items && limpiezas.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {limpiezas.items.map((limpieza: Cleaning) => (
                    <div
                      key={limpieza.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Limpieza
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          #{limpieza.numero_de_limpieza}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">
                        {limpieza.cliente?.nombre || "Cliente no especificado"}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                          <span>
                            {new Date(limpieza.fecha_de_limpieza).toLocaleDateString("es-AR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        
                        {limpieza.servicio?.id && (
                          <p className="text-xs">
                            Servicio ID: {limpieza.servicio.id}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500">
                        {(() => {
                          const today = new Date();
                          const cleaningDate = new Date(limpieza.fecha_de_limpieza);
                          const diffTime = cleaningDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays < 0) {
                            return <span className="text-red-600">Pasada ({Math.abs(diffDays)} días atrás)</span>;
                          } else if (diffDays === 0) {
                            return <span className="text-orange-600">Hoy</span>;
                          } else if (diffDays === 1) {
                            return <span className="text-orange-600">Mañana</span>;
                          } else {
                            return <span className="text-green-600">En {diffDays} días</span>;
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {limpiezas.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Mostrando {limpiezas.items.length} de {limpiezas.total} limpiezas
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(limpiezas.page - 1)}
                        disabled={limpiezas.page <= 1}
                      >
                        Anterior
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: limpiezas.totalPages }, (_, i) => i + 1)
                          .filter(pageNum => 
                            pageNum === 1 || 
                            pageNum === limpiezas.totalPages || 
                            Math.abs(pageNum - limpiezas.page) <= 1
                          )
                          .map((pageNum, index, array) => (
                            <React.Fragment key={pageNum}>
                              {index > 0 && array[index - 1] !== pageNum - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <Button
                                variant={pageNum === limpiezas.page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            </React.Fragment>
                          ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(limpiezas.page + 1)}
                        disabled={limpiezas.page >= limpiezas.totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay limpiezas programadas
                </h3>
                <p className="text-gray-500 mb-6">
                  No se encontraron limpiezas futuras para los próximos {days} días.
                </p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Intentar nuevamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
