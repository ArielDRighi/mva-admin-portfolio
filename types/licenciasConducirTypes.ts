// Tipo para una licencia de conducir
export interface LicenciaConducir {
  licencia_id: number;
  categoria: string;
  fecha_expedicion: string;
  fecha_vencimiento: string;
  empleado: {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
    telefono: string;
    email: string;
    direccion: string | null;
    fecha_nacimiento: string | null;
    fecha_contratacion: string;
    cargo: string;
    estado: string;
    numero_legajo: number | null;
    cuil: string | null;
    cbu: string | null;
    diasVacacionesTotal: number;
    diasVacacionesRestantes: number;
    diasVacacionesUsados: number;
  };
}

// Tipo para la respuesta de la API con licencias de conducir
export interface LicenciasConducirResponse {
  data: LicenciaConducir[];
  totalItems: number;
  currentPage: number;
  totalPages?: number;
}
