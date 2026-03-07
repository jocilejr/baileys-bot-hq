module.exports = {
  apps: [
    {
      name: "zapmanager-api",
      cwd: "./server",
      script: "node",
      args: "--import tsx dist/index.js",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      time: true,
    },
  ],
};
