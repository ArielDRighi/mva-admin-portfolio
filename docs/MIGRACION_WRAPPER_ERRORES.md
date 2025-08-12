# Guía de Migración al Patrón Wrapper de Manejo de Errores

Esta guía detalla cómo migrar progresivamente las acciones del servidor (server actions) existentes a utilizar el patrón wrapper `createServerAction` para un manejo de errores centralizado y consistente.

## Contexto

Actualmente, tenemos dos enfoques principales para manejar errores en las acciones del servidor:

1. **Enfoque manual**: Try/catch con `handleApiError` en cada función
2. **Enfoque con wrapper**: Utilizando `createServerAction` para envolver nuestras funciones

El objetivo es migrar progresivamente hacia el segundo enfoque para:

- Reducir código repetitivo
- Asegurar un manejo consistente de errores
- Simplificar la implementación de nuevas acciones del servidor

## Estructura Existente

### Enfoque manual (actualmente implementado):

```typescript
export async function getEntidades() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) throw new Error("Token no encontrado");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/entidades`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Error al obtener entidades");
    }

    return await res.json();
  } catch (error) {
    handleApiError(error, "Error al obtener entidades");
    throw error;
  }
}
```

### Enfoque con wrapper (objetivo):

```typescript
// Función base sin manejo de errores
async function fetchEntidades(): Promise<EntidadesResponse> {
  const token = getAuthToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/entidades`, {
    headers: createAuthHeaders(),
    cache: "no-store",
  });

  return handleApiResponse(res, "Error al obtener entidades");
}

// Exportación con wrapper de manejo de errores
export const getEntidades = createServerAction(
  fetchEntidades,
  "Error al obtener entidades"
);
```

## Pasos para la Migración

### 1. Evaluar las acciones del servidor existentes

Identifica las acciones del servidor que se beneficiarían más del patrón wrapper:

- Acciones frecuentemente utilizadas
- Acciones con lógica compleja de manejo de errores
- Acciones similares que comparten patrón de implementación

### 2. Refactorizar una acción a la vez

Para cada acción seleccionada:

1. **Crea la función base** sin manejo de errores:

   ```typescript
   async function fetchEntidades(): Promise<EntidadesResponse> {
     const token = getAuthToken();

     const res = await fetch(
       `${process.env.NEXT_PUBLIC_API_URL}/api/entidades`,
       {
         headers: createAuthHeaders(),
         cache: "no-store",
       }
     );

     return handleApiResponse(res, "Error al obtener entidades");
   }
   ```

2. **Exporta la función con el wrapper**:

   ```typescript
   export const getEntidades = createServerAction(
     fetchEntidades,
     "Error al obtener entidades"
   );
   ```

3. **Actualiza las referencias** en los componentes que la utilizan

### 3. Patrones comunes para diferentes tipos de acciones

#### Acciones de lectura (GET)

```typescript
async function fetchData(): Promise<DataResponse> {
  const token = getAuthToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`, {
    headers: createAuthHeaders(),
    cache: "no-store",
  });

  return handleApiResponse(res, "Error al obtener datos");
}

export const getData = createServerAction(fetchData, "Error al obtener datos");
```

#### Acciones de creación (POST)

```typescript
async function createItem(data: ItemData): Promise<ItemResponse> {
  const token = getAuthToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
    cache: "no-store",
  });

  return handleApiResponse(res, "Error al crear elemento");
}

export const createItem = createServerAction(
  createItem,
  "Error al crear elemento"
);
```

#### Acciones de actualización (PUT/PATCH)

```typescript
async function updateItem(id: number, data: ItemData): Promise<ItemResponse> {
  const token = getAuthToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/items/${id}`,
    {
      method: "PUT", // o "PATCH"
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
      cache: "no-store",
    }
  );

  return handleApiResponse(res, `Error al actualizar elemento ${id}`);
}

export const updateItem = createServerAction(
  updateItem,
  "Error al actualizar elemento"
);
```

#### Acciones de eliminación (DELETE)

```typescript
async function deleteItem(id: number): Promise<void> {
  const token = getAuthToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/items/${id}`,
    {
      method: "DELETE",
      headers: createAuthHeaders(),
      cache: "no-store",
    }
  );

  return handleApiResponse(res, `Error al eliminar elemento ${id}`);
}

export const deleteItem = createServerAction(
  deleteItem,
  "Error al eliminar elemento"
);
```

## Beneficios de la Migración

1. **Reducción de código repetitivo**: Elimina bloques try/catch repetidos
2. **Consistencia**: Garantiza que todas las acciones manejen los errores de manera uniforme
3. **Separación de responsabilidades**: Separa la lógica de la acción del manejo de errores
4. **Facilidad de mantenimiento**: Facilita actualizaciones futuras del manejo de errores
5. **Mejor testabilidad**: Las funciones base sin manejo de errores son más fáciles de probar

## Recomendaciones

1. Migra de forma gradual, priorizando las acciones más utilizadas
2. Considera agrupar acciones relacionadas en archivos específicos (p.ej., `userActions.ts`)
3. Documenta cualquier comportamiento especial de manejo de errores
4. Actualiza la documentación técnica a medida que migren las acciones

## Nota sobre TypeScript

Asegúrate de definir correctamente los tipos de datos para:

- Parámetros de entrada
- Respuestas esperadas
- Estados de error

Esto mejorará la seguridad de tipos y la experiencia de desarrollo.
