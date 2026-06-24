module.exports = {
  apps: [
    {
      name: 'medical-clinic',
      script: 'npx',
      args: 'vite preview --port 3002',
      cwd: '/var/www/care-weave-clinic',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        SUPABASE_URL: 'https://tiemqgrqpequpqogqgle.supabase.co',
        SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZW1xZ3JxcGVxdXBxb2dxZ2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjMzMzEsImV4cCI6MjA5Nzg5OTMzMX0.-cUKZeef3FJL9FLbxgkgITciJzz7xPpRsSGCzGr3FHM',
      },
    },
  ],
};
