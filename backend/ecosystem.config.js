// backend/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'irteqa-backend',
    script: 'src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 5001,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001,
    },
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // ✅ إعادة التشغيل التلقائي عند الفشل
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // ✅ توزيع الحمل
    instance_var: 'INSTANCE_ID',
  }],
};