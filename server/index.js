import app from './app.js';

const PORT = process.env.API_PORT || 5000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log(' DEPARTMENT ACADEMIC CLOUD — BACKEND SERVER ONLINE');
  console.log(` Port: ${PORT} | Database: Supabase`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
