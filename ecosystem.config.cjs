const path = require('path');

module.exports = {
  apps: [
    {
      name: 'echo-web',
      script: 'npm',
      args: 'run dev',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // For production, you should build first and use: args: 'run preview'
      error_file: path.join(__dirname, 'logs', 'web-error.log'),
      out_file: path.join(__dirname, 'logs', 'web-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'echo-auth',
      script: 'npm',
      args: 'run dev:auth',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 3003,
        NEXTAUTH_URL: 'http://localhost:3001',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXTAUTH_URL: 'https://isobel.battlecry.tech',
      },
      error_file: path.join(__dirname, 'logs', 'auth-error.log'),
      out_file: path.join(__dirname, 'logs', 'auth-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
