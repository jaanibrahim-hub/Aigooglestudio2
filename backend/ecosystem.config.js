module.exports = {
  apps: [{
    name: 'fit-check-backend',
    script: './server.js',
    cwd: '/home/user/webapp/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s',
    log_file: '/home/user/webapp/backend/pm2.log',
    out_file: '/home/user/webapp/backend/pm2-out.log',
    error_file: '/home/user/webapp/backend/pm2-error.log'
  }]
};