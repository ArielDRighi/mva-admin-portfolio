#!/bin/bash

# Eliminar cualquier archivo .next existente
echo "Limpiando instalación previa..."
rm -rf .next

# Aumentar el límite de memoria para el proceso de Node
export NODE_OPTIONS="--max-old-space-size=4096"

# Ejecutar el build con eslint desactivado
echo "Iniciando build sin verificación de ESLint..."
npx next build --no-lint

# Verificar si el build fue exitoso
if [ $? -eq 0 ]; then
  echo "✅ Build completado con éxito!"
  echo "Para iniciar la aplicación, ejecuta: npm run start"
else
  echo "❌ El build falló. Revisa los errores anteriores."
fi
