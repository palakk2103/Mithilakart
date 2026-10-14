module.exports = {
  apps: [
    {
      name: 'mithilakart-api',
      script: 'src/server.js',
      cwd: '/var/www/mithilakart/backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_PRETTY: 'false',
        RATE_LIMIT_ENABLED: 'true',
        METRICS_ENABLED: 'true',
      },
      error_file: '/var/log/pm2/mithilakart-api-error.log',
      out_file: '/var/log/pm2/mithilakart-api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000,
    },
  ],
};
