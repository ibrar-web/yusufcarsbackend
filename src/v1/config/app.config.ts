export const appConfig = () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cookieName: process.env.COOKIE_NAME || 'access_token',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
});


