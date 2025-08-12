"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationLocalProps {
  total: number;
  currentPage: number;
  onChangePage: (page: number) => void;
}

export const PaginationLocal = ({
  total,
  currentPage,
  onChangePage,
}: PaginationLocalProps) => {
  if (total <= 1) return null;

  const getPageButtons = (
    total: number,
    currentPage: number
  ): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Si estamos en la primera página
    if (currentPage === 1) {
      pages.push(1, 2, 3);
      if (total > 3) pages.push("...");
      pages.push(total);
    }
    // Si estamos en la última página
    else if (currentPage === total) {
      pages.push(1);
      if (total > 3) pages.push("...");
      pages.push(total - 2, total - 1, total);
    }
    // Si estamos en una página intermedia
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(total - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < total - 2) pages.push("...");
      pages.push(total);
    }

    return pages;
  };

  const pageButtons = getPageButtons(total, currentPage);

  return (
    <div className="flex items-center gap-2">
      {/* Botón de "Anterior" */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChangePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="cursor-pointer hidden @min-[350px]:block"
        type="button"
      >
        <ChevronLeft />
      </Button>

      {/* Botones de las páginas calculadas */}
      {pageButtons.map((page, index) =>
        typeof page === "number" ? (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onChangePage(page)}
            className="cursor-pointer"
            type="button"
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="text-gray-500">
            ...
          </span>
        )
      )}

      {/* Botón de "Siguiente" */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChangePage(currentPage + 1)}
        disabled={currentPage === total}
        className="cursor-pointer hidden @min-[350px]:block"
        type="button"
      >
        <ChevronRight />
      </Button>
    </div>
  );
};
