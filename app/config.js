// Configuración centralizada para la aplicación admin
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://admin.mvasrl.com',
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;
