import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import React from "react";

/**
 * Formatea una fecha para su uso en inputs de tipo date
 * Maneja diferentes formatos de fecha y casos especiales
 */
const formatDateForInput = (value: string): string => {
  // Si ya está en formato yyyy-mm-dd, lo devolvemos directamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  try {
    // Intentamos crear un objeto Date
    const date = new Date(value);

    // Verificamos si es una fecha válida
    if (isNaN(date.getTime())) {
      console.warn("Fecha inválida recibida:", value);
      return ""; // Retornamos string vacío para evitar errores
    }

    // Formateamos la fecha como yyyy-mm-dd
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error al procesar fecha:", value, error);
    return ""; // En caso de error, devolvemos string vacío
  }
};

type FieldType = "input" | "select";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  fieldType?: FieldType;
  value?: string;
  onChange?: (value: string) => void;
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  // Agregamos esto para aceptar cualquier otro atributo de un input
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  fieldType = "input",
  value = "",
  onChange,
  options = [],
  placeholder,
  required = false,
  error,
  helperText,
  ...rest // <- capturamos los demás props
}) => {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={name} className="block font-medium">
        {label}
      </Label>
      {fieldType === "input" && (
        <Input
          id={name}
          name={name}
          type={type}
          value={
            type === "date" && value
              ? formatDateForInput(value) // Utilizamos función para manejar casos edge
              : value
          }
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          {...rest}
        />
      )}
      {fieldType === "select" && (
        <Select value={value} onValueChange={onChange} required={required}>
          <SelectTrigger>
            <span>{value || placeholder || `Seleccionar ${label}`}</span>
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}{" "}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};
