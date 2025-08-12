#!/bin/bash

# Script para compilar ignorando errores de eslint
echo "Iniciando build con eslint ignorado"
export NODE_OPTIONS=--max-old-space-size=4096
npx next build --no-eslint
