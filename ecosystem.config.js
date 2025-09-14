module.exports = {
  apps: [{
    name: 'fit-check-app',
    script: 'npx',
    args: 'vite dev --host 0.0.0.0 --port 3000',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'development'
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    log_file: '/home/user/webapp/pm2.log',
    out_file: '/home/user/webapp/pm2-out.log',
    error_file: '/home/user/webapp/pm2-error.log'
  }]
};