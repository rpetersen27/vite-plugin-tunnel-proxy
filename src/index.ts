import type { Plugin, ViteDevServer, Logger } from 'vite'
import colors from 'colors'
import HTTPProxyServer from './HTTPProxyServer'

export default function ({
  port = 8080,
  protocol = 'http'
}: {
  port?: number
  protocol?: 'http'
} = {}): Plugin {
  let logger: Logger

  return {
    name: 'vite-plugin-connect-proxy',

    configResolved (config) {
      logger = config.logger
    },

    async configureServer (server: ViteDevServer) {
      if (protocol !== 'http') throw new Error('Only "http" protocol is supported')

      const { httpServer } = server
      if (httpServer === null) throw new Error('No vite-dev-server found')

      const proxyServer = new HTTPProxyServer(httpServer)

      proxyServer.on('error', (err) => { logger.error(colors.cyan('[vite-plugin-connect-proxy] ') + colors.red(err.message)) })
      await proxyServer.open(port).then(() => { logger.info(colors.cyan('[vite-plugin-connect-proxy] ') + `Created HTTP proxy on port ${port}`) })

      httpServer.on('close', () => {
        void proxyServer.close()
      })
    }
  }
}
