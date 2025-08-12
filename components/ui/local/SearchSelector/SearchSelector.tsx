"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { debounce } from 'lodash';

export interface Selectable {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface SearchSelectorProps<T extends Selectable> {
  value: number;
  onChange: (id: number) => void;
  label: string;
  name: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;

  searchFn: (searchTerm: string) => Promise<T[]>;
  getItemById?: (id: number) => Promise<T>;

  renderSelected: (item: T) => React.ReactNode;
  renderItem: (item: T, handleSelect: (item: T) => void) => React.ReactNode;

  minSearchLength?: number;
  debounceTime?: number;
}

export function SearchSelector<T extends Selectable>({
  value,
  onChange,
  label,
  name,
  error,
  disabled = false,
  placeholder = "Buscar...",
  searchFn,
  getItemById,
  renderSelected,
  renderItem,
  minSearchLength = 2,
  debounceTime = 300,
}: SearchSelectorProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carga el elemento seleccionado cuando se proporciona un ID
  useEffect(() => {
    const fetchSelectedItem = async () => {
      if (value > 0 && !selectedItem && getItemById) {
        setLoading(true);
        try {
          const item = await getItemById(value);
          setSelectedItem(item);        } catch (error) {
          console.error(`Error al cargar el elemento con ID ${value}:`, error);
          
          // El manejo de errores específico ahora se realiza en cada implementación de getItemById
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSelectedItem();
  }, [value, selectedItem, getItemById]);

  const searchItems = debounce(async (term: string) => {
    if (!term || term.length < minSearchLength) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchFn(term);
      setItems(results);    } catch (error) {
      console.error("Error al buscar:", error);
      // El manejo de errores específico ahora se realiza en cada implementación de searchFn
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, debounceTime);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    // No buscar aquí, solo actualiza el término
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchItems(searchTerm);
    }
  };

  const handleSelectItem = (item: T) => {
    setSelectedItem(item);
    setSearchTerm("");
    setIsOpen(false);
    onChange(item.id);
  };

  const handleClearSelection = () => {
    setSelectedItem(null);
    setSearchTerm("");
    onChange(0);
  };

  return (
    <div className="w-full space-y-2" ref={dropdownRef}>
      <label
        htmlFor={name}
        className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      
      <div className="relative">
        {selectedItem ? (
          <div className="flex items-center justify-between p-2 border rounded-md">
            {renderSelected(selectedItem)}
            <button 
              type="button" 
              onClick={handleClearSelection}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id={name}
              name={name}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pl-9"
              disabled={disabled}
            />
          </div>
        )}

        {isOpen && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-2 text-center text-sm text-gray-500">Buscando...</div>
            ) : items.length > 0 ? (
              items.map((item) => renderItem(item, handleSelectItem))
            ) : (
              <div className="p-2 text-center text-sm text-gray-500">
                {searchTerm.length < minSearchLength
                  ? `Escribe al menos ${minSearchLength} caracteres`
                  : "No se encontraron resultados"}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm font-medium text-destructive mt-1">{error}</p>}
    </div>
  );
}