import { useMemo, useState, ReactNode, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationLocal } from "./PaginationLocal";

interface Column {
  title: string;
  key: string;
  className?: string;
}

interface ListadoTablaProps<T> {
  title?: string;
  data: T[];
  columns: Column[];
  renderRow: (item: T) => ReactNode;
  itemsPerPage?: number;
  searchableKeys?: string[]; // Cambiado de (keyof T)[] a string[] para permitir propiedades anidadas
  remotePagination?: boolean;
  totalItems?: number;
  currentPage?: number;
  searchPlaceholder?: string;
  searchValue?: string; // Nuevo: valor de búsqueda controlado externamente
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onSearchClear?: () => void; // Nuevo: callback para limpiar búsqueda
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  addButton?: ReactNode;
}

export function ListadoTabla<T>({
  title = "Listado",
  data = [],
  columns,
  renderRow,
  itemsPerPage = 15,
  searchableKeys = [],
  remotePagination = false,
  totalItems,
  currentPage: externalPage,
  searchPlaceholder = "Buscar... (presiona Enter)",
  searchValue,
  onPageChange,
  onSearchChange,
  onSearchClear,
  onEdit,
  onDelete,
  addButton,
}: ListadoTablaProps<T>) {
  const [searchTerm, setSearchTerm] = useState(searchValue || "");
  const [internalPage, setInternalPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar el estado interno con el valor externo
  useEffect(() => {
    if (searchValue !== undefined) {
      setSearchTerm(searchValue);
    }
  }, [searchValue]);

  useEffect(() => {
    // Esperar a que el componente esté montado en el cliente
    setIsMounted(true);
  }, []);

  const currentPage = remotePagination ? externalPage ?? 1 : internalPage;
  /**
   * Función para obtener el valor de una propiedad anidada usando notación de puntos
   * Por ejemplo: "toilet.codigo_interno" obtendrá item.toilet.codigo_interno
   */
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): unknown => {
    const keys = path.split(".");
    return keys.reduce((acc: unknown, key: string) => {
      return acc && typeof acc === "object"
        ? (acc as Record<string, unknown>)[key]
        : undefined;
    }, obj);
  };

  const filteredData = useMemo(() => {
    // Si la paginación es remota, no filtramos datos localmente
    if (remotePagination) return data;

    // Si no hay términos de búsqueda o no hay campos buscables, devolver todos los datos
    if (searchableKeys.length === 0 || searchTerm.trim() === "") return data;

    // El término de búsqueda normalizado
    const normalizedSearchTerm = searchTerm.toLowerCase().trim(); // Filtrar datos por el término de búsqueda
    return data.filter((item) =>
      searchableKeys.some((key) => {
        // Obtener el valor para esta clave (soportando propiedades anidadas)
        const rawValue = getNestedValue(item as Record<string, unknown>, key);

        // Manejar diferentes tipos de valores
        if (rawValue === null || rawValue === undefined) return false;

        // Convertir el valor a string para búsqueda
        const value = String(rawValue).toLowerCase();

        // Verificar si el valor incluye el término de búsqueda
        return value.includes(normalizedSearchTerm);
      })
    );
  }, [searchTerm, data, searchableKeys, remotePagination]);

  const totalPages = remotePagination
    ? Math.ceil((totalItems ?? 0) / itemsPerPage)
    : Math.ceil(filteredData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    if (remotePagination) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage, remotePagination]);

  const handlePageChange = (page: number) => {
    if (remotePagination && onPageChange) {
      onPageChange(page);
    } else {
      setInternalPage(page);
    }
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Cancelar cualquier timer pendiente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Ejecutar búsqueda inmediatamente cuando se presiona Enter
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  };
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Ya no ejecutamos búsqueda automática - solo al presionar Enter
    // Cancelar cualquier timer pendiente si el usuario está escribiendo
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");

    // Limpiar timeout pendiente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (onSearchClear) {
      onSearchClear();
    } else if (onSearchChange) {
      onSearchChange("");
    }
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // // Efecto para implementar búsqueda automática con debounce
  // useEffect(() => {
  //   if (!remotePagination) return; // Sólo para búsqueda remota

  //   const timer = setTimeout(() => {
  //     if (onSearchChange) {
  //       onSearchChange(searchTerm);
  //     }
  //   }, 500); // 500ms de debounce

  //   return () => {
  //     clearTimeout(timer);
  //   };
  // }, [searchTerm, onSearchChange, remotePagination]);
  // Si no está montado en el cliente, mostramos un esqueleto
  if (!isMounted) {
    return (
      <Card className="w-full shadow-md border @container">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="h-7 bg-gray-100 animate-pulse rounded w-40"></div>
            <div className="h-10 bg-gray-100 animate-pulse rounded w-56"></div>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <div className="h-64 bg-gray-50 animate-pulse flex items-center justify-center">
              <div className="text-gray-400">Cargando datos...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md border @container">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4 flex-col lg:flex-row">
            <h2 className="text-xl font-semibold">{title}</h2>
            {addButton}
          </div>{" "}
          {searchableKeys.length > 0 && (
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative">
                {" "}
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-80 max-w-sm pl-8 pr-10"
                />
                <span className="absolute left-2.5 top-2.5 text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-search"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-x"
                    >
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.className}>
                    {col.title}
                  </TableHead>
                ))}
                {(onEdit || onDelete) && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <TableRow key={index}>
                    {renderRow(item)}
                    {(onEdit || onDelete) && (
                      <TableCell className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "¿Estás seguro que deseas eliminar este ítem?"
                                )
                              ) {
                                onDelete(item);
                              }
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-center">
          <PaginationLocal
            total={totalPages}
            currentPage={currentPage}
            onChangePage={handlePageChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
