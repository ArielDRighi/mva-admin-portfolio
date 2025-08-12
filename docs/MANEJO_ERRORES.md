# Sistema de Manejo de Errores para MVA Admin

Este sistema proporciona una forma consistente de manejar errores en las acciones del servidor (server actions) y mostrar notificaciones toast al usuario cuando ocurren errores.

## Archivos principales

- `lib/errors.ts`: Contiene las funciones para manejar errores y mostrar notificaciones toast.
- `lib/actions.ts`: Proporciona utilidades para crear acciones del servidor con manejo de errores integrado.

## Cómo usar el manejo de errores

### Método 1: Envolver acciones existentes con try-catch

Para acciones existentes, añade un try-catch y utiliza la función `handleApiError`:

```typescript
export async function getSomeData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) throw new Error("Token no encontrado");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/some-endpoint`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) throw new Error("Error al obtener datos");

    return await res.json();
  } catch (error) {
    handleApiError(error, "Error al obtener los datos");
    throw error;
  }
}
```

### Método 2: Crear nuevas acciones con el wrapper

Para nuevas acciones, usa la función `createServerAction`:

```typescript
export const getSomeData = createServerAction(async (params) => {
  const token = getAuthToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/some-endpoint`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  return handleApiResponse(res, "Error al obtener los datos");
}, "Error al obtener los datos");
```

## Otras utilidades disponibles

- `getErrorMessage(error)`: Extrae el mensaje más descriptivo de un error
- `getAuthToken()`: Obtiene el token de autenticación de las cookies
- `createAuthHeaders()`: Crea los headers necesarios para las peticiones autenticadas
- `handleApiResponse(response, errorMessage)`: Maneja las respuestas de la API

## Beneficios

1. Notificaciones de error consistentes a través de toast
2. Manejo centralizado de errores
3. Código más limpio y mantenible
4. Mejor experiencia de usuario al mostrar errores significativos
5. Facilita la depuración

## Recomendaciones

- Usa mensajes de error claros y específicos
- Asegúrate de que cada acción del servidor tenga manejo de errores
- Para peticiones de modificación (POST, PUT, DELETE), intenta extraer el mensaje de error de la respuesta
