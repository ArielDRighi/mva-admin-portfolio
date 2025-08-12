#!/bin/bash

# Eliminar el calendario antiguo
rm -f /root/mva-admin/components/ui/calendar.tsx

# Limpiar la caché de npm
npm cache clean --force

# Eliminar node_modules y package-lock.json
rm -rf /root/mva-admin/node_modules
rm -f /root/mva-admin/package-lock.json

# Intentar la instalación nuevamente
cd /root/mva-admin
npm install --no-package-lock

echo "Proceso completado"
