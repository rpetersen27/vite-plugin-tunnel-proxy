import type { Plugin, ViteDevServer, Logger } from 'vite'
import colors from 'colors'
import HTTPProxyServer from './HTTPProxyServer.js'

export default function ({
  port = 8080,
  protocol = 'http'
}: {
  port?: number
  protocol?: 'http'
} = {}): Plugin {
  let logger: Logger

  return {
    name: 'vite-plugin-tunnel-proxy',

    configResolved (config) {
      logger = config.logger
    },

    async configureServer (server: ViteDevServer) {
      if (protocol !== 'http') throw new Error('Only "http" protocol is supported')

      const { httpServer }: ViteDevServer = server
      if (httpServer === null) {
        logger.error(colors.cyan('[vite-plugin-connect-proxy] ') + colors.red('Vite is running in middlewareMode, which is not supported by this plugin.'))
        return
      }

      const proxyServer = new HTTPProxyServer(httpServer)

      proxyServer.on('error', (err) => { logger.error(colors.cyan('[vite-plugin-tunnel-proxy] ') + colors.red(err.message)) })
      await proxyServer.open(port).then(() => { logger.info(colors.cyan('[vite-plugin-tunnel-proxy] ') + `Created HTTP proxy on port ${port}`) })

      httpServer.on('close', () => {
        void proxyServer.close()
      })
    }
  }
}
