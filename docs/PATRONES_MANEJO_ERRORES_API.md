# Patrones de Manejo de Errores en Llamadas a API

Este documento describe los patrones estándar de manejo de errores en llamadas a API que deben seguirse en el proyecto MVA Admin.

## Principios Generales

1. **Tipado Explícito**: Siempre definir interfaces para las respuestas de API
2. **Manejo de Errores Consistente**: Usar estructuras try/catch para todas las llamadas a API
3. **Mensajes de Error Descriptivos**: Proporcionar información clara sobre los errores
4. **Valores de Retorno Seguros**: En caso de error, devolver objetos vacíos o valores por defecto seguros
5. **Toast Notifications Estandarizadas**: Usar el mismo formato para todas las notificaciones

## Patrón para Solicitudes a API

```typescript
// 1. Definir interfaces para las respuestas esperadas
interface ApiResponse {
  data?: DataType[];
  items?: DataType[];
  totalItems?: number;
  currentPage?: number;
}

// 2. Función con tipado explícito
const fetchData = async (): Promise<DataType[]> => {
  try {
    // 3. Utilizar tipado explícito en la respuesta
    const response = (await apiCall()) as ApiResponse;

    // 4. Validación de estructura
    if (response && typeof response === "object") {
      const items = response.data || response.items || [];
      return items;
    }
    return [];
  } catch (error) {
    // 5. Registro del error para debugging
    console.error("Error en la solicitud:", error);

    // 6. Extracción del mensaje de error
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    // 7. Notificación estandarizada
    toast.error("Título descriptivo del error", {
      description: errorMessage,
      duration: 5000,
    });

    // 8. Valor de retorno seguro
    return [];
  }
};
```

## Toast Notifications Estandarizados

### Para Errores

```typescript
toast.error("Título conciso del error", {
  description: errorMessage,
  duration: 5000,
});
```

### Para Éxitos

```typescript
toast.success("Operación completada", {
  description: "Descripción más detallada del éxito",
  duration: 3000,
});
```

## Validación de Respuestas API

Siempre verificar todas las estructuras posibles:

```typescript
if (response && typeof response === "object") {
  // Caso 1: { data: [] }
  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }
  // Caso 2: { items: [] }
  else if ("items" in response && Array.isArray(response.items)) {
    return response.items;
  }
  // Caso 3: Array directo
  else if (Array.isArray(response)) {
    return response;
  }
  // Caso de error o formato desconocido
  else {
    console.warn("Formato de respuesta desconocido:", response);
    return [];
  }
}
```

## Logging Estructurado

Para logging efectivo en caso de errores:

```typescript
console.error("Error descriptivo:", {
  tipo: typeof errorObject,
  mensaje: errorObject.message,
  codigo: errorObject.statusCode,
  datos: JSON.stringify(errorObject).substring(0, 100) + "...",
});
```

---

Siguiendo estos patrones de manera consistente, mantendremos un código predecible, robusto y fácil de mantener frente a posibles errores de API.
