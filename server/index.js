import app from './app.js';

// Hosts like Render tell the app which port to use through PORT. Locally PORT
// may belong to the Vite dev server, so it is only used in production.
const PORT =
  process.env.API_PORT || (process.env.NODE_ENV === 'production' ? process.env.PORT : undefined) || 5000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(' DEPARTMENT ACADEMIC CLOUD — BACKEND SERVER ONLINE');
  console.log(` Port: ${PORT} | Database: Supabase`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
