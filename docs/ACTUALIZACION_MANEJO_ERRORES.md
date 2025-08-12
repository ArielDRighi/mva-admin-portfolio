# Guía de Actualización: Implementación de Manejo de Errores en el Proyecto MVA

Esta guía describe cómo modernizar los archivos de acciones para incorporar un manejo de errores robusto y consistente, integrado con notificaciones toast.

## Pasos para actualizar cada archivo de acción

### 1. Importar las nuevas utilidades

Al principio de cada archivo de acción, añade estas importaciones:

```typescript
import {
  createServerAction,
  createAuthHeaders,
  getAuthToken,
  handleApiResponse,
} from "@/lib/actions";
import { handleApiError } from "@/lib/errors";
```

### 2. Modernizar las funciones existentes

Para cada función de acción:

1. Crea una versión mejorada usando `createServerAction`
2. Mantén la función original para compatibilidad (opcional)

**Ejemplo:**

```typescript
// Versión mejorada con manejo de errores
export const getItems = createServerAction(
  async (page: number = 1, limit: number = 15) => {
    const token = getAuthToken();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/items?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    return handleApiResponse(res, "Error al obtener los items");
  },
  "Error al obtener los items"
);

// Versión anterior para compatibilidad
export async function getItemsOld(page: number = 1, limit: number = 15) {
  try {
    return await getItems(page, limit);
  } catch (error) {
    handleApiError(error, "Error al obtener los items");
    throw error;
  }
}
```

### 3. Pasos para actualizar funciones GET

```typescript
// De:
export async function getItems() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) throw new Error("Token no encontrado");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Error al obtener los items");

  return res.json();
}

// A:
export const getItems = createServerAction(async () => {
  const token = getAuthToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return handleApiResponse(res, "Error al obtener los items");
}, "Error al obtener los items");
```

### 4. Pasos para actualizar funciones POST/PUT/PATCH/DELETE

```typescript
// De:
export async function createItem(data: ItemData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) throw new Error("Token no encontrado");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al crear el item");
  }

  return res.json();
}

// A:
export const createItem = createServerAction(async (data: ItemData) => {
  const token = getAuthToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify(data),
    cache: "no-store",
  });

  return handleApiResponse(res, "Error al crear el item");
}, "Error al crear el item");
```

## Consejos adicionales

- Utiliza mensajes de error específicos y descriptivos
- Agrupa acciones relacionadas para mantener la coherencia
- Considera migrar gradualmente a las nuevas funciones para evitar interrupciones
- Actualiza las referencias a las funciones antiguas en los componentes

## Beneficios del nuevo sistema

1. Notificaciones de error consistentes a través de toast
2. Manejo centralizado de errores
3. Código más limpio y mantenible
4. Mejor experiencia de usuario al mostrar errores significativos
5. Facilita la depuración
