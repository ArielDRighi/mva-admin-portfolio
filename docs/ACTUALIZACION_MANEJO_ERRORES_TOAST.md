# Actualización del Manejo de Errores en MVA Admin

## Nuevo Enfoque de Manejo de Errores

Hemos actualizado el sistema de manejo de errores para mejorar la experiencia del usuario y mostrar mensajes de error más informativos.

### Cambios Principales

1. **`lib/errors.ts`**:

   - La función `handleApiError` ahora solo procesa el mensaje de error sin mostrar un toast.
   - Se ha mejorado la extracción de mensajes de error específicos de las respuestas de la API.

2. **`lib/actions.ts`**:

   - Se corrigió el tipo `ActionWithErrorHandling` para usar correctamente `Promise<Result>` en lugar de `Promise<r>`.
   - La función `createServerAction` ahora lanza un error mejorado con el mensaje procesado para que sea capturado por los componentes.
   - Los errores ahora contienen mejor información para la depuración.

3. **Componentes que utilizan acciones del servidor**:
   - Ahora capturan explícitamente el mensaje de error del error lanzado.
   - Muestran toast con el mensaje específico del error.

## Cómo Utilizar el Nuevo Sistema de Errores

### En acciones del servidor:

```typescript
// Las acciones del servidor ya manejan los errores correctamente
export const miAccion = createServerAction(
  async (params) => {
    // Tu lógica aquí
    const respuesta = await fetch(...);
    return handleApiResponse(respuesta, "Mensaje de error por defecto");
  },
  "Mensaje de error por defecto si falla la acción"
);
```

### En componentes:

```typescript
const miFuncion = async () => {
  try {
    // Llama a la acción del servidor
    await miAccion(parametros);

    // Si todo salió bien, muestra un toast de éxito
    toast.success("Operación exitosa", {
      description: "La operación se completó correctamente",
    });
  } catch (error) {
    console.error("Error en la operación:", error);

    // Extrae el mensaje de error
    let errorMessage = "Error genérico";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Muestra un toast con el mensaje específico
    toast.error("Error", {
      description: errorMessage,
      duration: 5000,
    });
  }
};
```

## Beneficios

- Mayor consistencia en la presentación de errores al usuario.
- Mensajes de error más específicos y útiles directamente del backend.
- Mejor experiencia de usuario al proporcionar información más clara sobre problemas.
