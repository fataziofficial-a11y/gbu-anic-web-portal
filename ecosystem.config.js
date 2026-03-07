/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "anic-portal",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: "/var/www/gbu-anic",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      max_memory_restart: "512M",
      error_file: "/var/log/pm2/anic-portal-error.log",
      out_file: "/var/log/pm2/anic-portal-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
      // Автоматический перезапуск в 4:00 для очистки памяти
      cron_restart: "0 4 * * *",
    },
  ],
};
