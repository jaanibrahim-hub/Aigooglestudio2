export default {
  apps: [{
    name: 'fit-check-app',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp',
    env: {
      NODE_ENV: 'development',
      HOST: '0.0.0.0',
      PORT: 3000
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