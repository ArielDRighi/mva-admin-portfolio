# Deploy Guide - Vercel

## 🚀 Guía de Despliegue para Vercel - MVA Admin

Esta documentación te ayudará a configurar correctamente el frontend para desplegar en Vercel con el backend de Railway ya desplegado.

### 🎯 **BACKEND DESPLEGADO:**

```
https://mva-backend-portfolio-production.up.railway.app
```

### 🔐 **CREDENCIALES DE PRUEBA:**

```bash
EMAIL: test@ar.com
PASSWORD: Test1234
ROLES: ["ADMIN"]
```

---

## 📋 Pre-requisitos

### ✅ Checklist antes del deploy:

- [x] Backend desplegado y accesible en Railway
- [ ] Variables de entorno configuradas en Vercel
- [x] Configuraciones específicas removidas
- [ ] Build local funcionando correctamente (`npm run build`)
- [ ] Testing con las credenciales de prueba

---

## 🔧 Configuraciones Necesarias

### 1. **Variables de Entorno en Vercel**

En tu dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

```bash
# URL principal del API (tu backend en Railway)
NEXT_PUBLIC_API_URL=https://mva-backend-portfolio-production.up.railway.app/api

# URL base del backend (sin /api)
NEXT_PUBLIC_BASE_URL=https://mva-backend-portfolio-production.up.railway.app

# Entorno
NEXT_PUBLIC_ENV=production
NODE_ENV=production
```

**⚠️ Importante**:

- `NEXT_PUBLIC_API_URL` debe apuntar a tu backend en Railway con `/api` al final
- `NEXT_PUBLIC_BASE_URL` es la URL base sin `/api`
- Estas variables deben estar disponibles en **Development**, **Preview** y **Production**

---

### 2. **Configuración de next.config.ts**

El archivo `next.config.ts` debe quedar así para Vercel:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Sin configuraciones específicas de dominio para Vercel
  // Vercel maneja automáticamente los assets y routing
};

export default nextConfig;
```

**❌ NO usar para Vercel:**

- `assetPrefix` (Vercel lo maneja automáticamente)
- `basePath` con URLs específicas
- Rutas hardcodeadas de certificados SSL

---

### 3. **Configuración de app/config.js**

Asegúrate de que el archivo use las variables de entorno correctamente:

```javascript
// Configuración centralizada para la aplicación admin
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  environment: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

export default config;
```

---

### 4. **Package.json Scripts**

Verifica que los scripts estén configurados correctamente:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  }
}
```

**📝 Nota**: Vercel usará automáticamente `npm run build` para construir y `npm run start` para servir.

---

## 🗂️ Archivos a Excluir del Deploy

### **.vercelignore** (crear si no existe)

```bash
# Archivos específicos de otros hosting
ecosystem.config.js
start-https.js

# Documentación de deploy anterior
DEPLOYMENT_SUMMARY.md
DEPLOY_CLEAN.md

# Archivos temporales
debug-config.js
temp/
.env.local
```

### **Limpiar archivos innecesarios:**

Antes del deploy, puedes eliminar estos archivos que eran específicos de Hostinger:

```bash
# Archivos que puedes eliminar
rm ecosystem.config.js        # Configuración PM2
rm start-https.js            # Servidor HTTPS personalizado
rm DEPLOYMENT_SUMMARY.md     # Documentación anterior
rm debug-config.js           # Archivo temporal
```

---

## 🌐 Configuración en Vercel Dashboard

### **1. Conectar Repositorio**

- Ve a [vercel.com](https://vercel.com)
- Click en **"New Project"**
- Conecta tu repositorio de GitHub
- Selecciona `ar-admin-portfolio`

### **2. Build Settings**

Vercel debería detectar automáticamente:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **3. Environment Variables**

En **Settings → Environment Variables**, agrega todas las variables mencionadas arriba.

### **4. Domains**

- Vercel te dará un dominio automático: `tu-app.vercel.app`
- Puedes agregar un dominio personalizado si tienes uno

---

## 🔍 Testing del Deploy

### **Verificaciones post-deploy:**

1. **✅ Página principal carga**: `https://tu-app.vercel.app`
2. **✅ Login carga correctamente**: `https://tu-app.vercel.app/login`
3. **✅ Variables de entorno**: Verificar en Network tab que las peticiones van a tu backend
4. **✅ Login funcional**: Probar con credenciales reales
5. **✅ Navegación**: Verificar que todas las rutas funcionan

### **Debug si algo falla:**

1. **Ver logs de build**: En Vercel dashboard → Functions → View Function Logs
2. **Verificar variables**: Asegurar que `NEXT_PUBLIC_API_URL` esté configurada
3. **Network tab**: Verificar que las peticiones HTTP van a la URL correcta
4. **Console errors**: Revisar errores JavaScript en el navegador

---

## 🔄 Flujo de Desarrollo vs Producción

### **Desarrollo Local:**

```bash
# Variables en .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3001

# Comandos
npm run dev    # Puerto 3001
```

### **Producción Vercel:**

```bash
# Variables en Vercel Dashboard
NEXT_PUBLIC_API_URL=https://tu-backend-production.com
NODE_ENV=production

# Vercel se encarga del build y deploy automáticamente
```

---

## 📚 Recursos Adicionales

### **Enlaces útiles:**

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

### **Comandos útiles:**

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy desde terminal (opcional)
vercel --prod

# Ver logs
vercel logs tu-app-url.vercel.app
```

---

## 🚨 Troubleshooting Común

### **❌ "Login queda en Cargando"**

- ✅ Verificar `NEXT_PUBLIC_API_URL` en variables de entorno
- ✅ Confirmar que el backend esté accesible públicamente
- ✅ Revisar CORS en el backend para permitir tu dominio de Vercel

### **❌ "Assets no cargan"**

- ✅ Confirmar que `assetPrefix` esté comentado en `next.config.ts`
- ✅ Limpiar caché del navegador
- ✅ Verificar que no hay rutas hardcodeadas

### **❌ "Variables de entorno undefined"**

- ✅ Variables deben empezar con `NEXT_PUBLIC_` para el cliente
- ✅ Configuradas en Vercel Dashboard para todos los ambientes
- ✅ Redeploy después de agregar variables

---

## ✅ Checklist Final

Antes de hacer el deploy:

- [ ] Backend funcionando y accesible públicamente
- [ ] Variables de entorno configuradas en Vercel
- [ ] `next.config.ts` sin configuraciones de Hostinger
- [ ] Build local exitoso (`npm run build`)
- [ ] Login funciona en `npm run start`
- [ ] Archivos innecesarios eliminados
- [ ] `.vercelignore` configurado

---

**🎉 ¡Listo para Deploy!**

Con esta configuración tu aplicación debería funcionar perfectamente en Vercel.
