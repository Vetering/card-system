const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://localhost:7070',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
    }
  }
})