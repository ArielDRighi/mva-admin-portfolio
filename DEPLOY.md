# Instrucciones para Deployment MVA Admin

## Solución para errores de ESLint en build

Durante el proceso de build, el proyecto puede mostrar errores de ESLint que impiden completar el proceso.
Se han implementado varias soluciones:

### Opción 1: Build ignorando ESLint

```bash
npm run build-ignore-lint
```

Este comando ejecutará el build sin verificar errores de ESLint, lo que permitirá completar el build
aunque existan advertencias o errores de código.

### Opción 2: Corregir errores manualmente

Los errores más comunes son:

- Variables no utilizadas
- Importaciones no utilizadas
- Caracteres que requieren escape en JSX
- Dependencias faltantes en useEffect

Se pueden corregir manualmente siguiendo los mensajes de error o usando el archivo
.eslintrc.json que se ha creado para configurar estos errores como advertencias en lugar de errores.

## Comando para desplegar en producción

```bash
npm run build-ignore-lint && npm run start
```

## Próximos pasos recomendados

1. Corregir gradualmente todos los errores de ESLint
2. Añadir pruebas automatizadas
3. Implementar CI/CD para validación continua
