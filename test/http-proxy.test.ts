import { fileURLToPath } from 'node:url'
import http from 'node:http'
import { createServer, ViteDevServer } from 'vite'
import { expect } from 'chai'
import vitePluginConnectProxy from '../src/index'

const dirname = fileURLToPath(new URL('.', import.meta.url))
let server: ViteDevServer

describe('http-proxy', () => {
  beforeEach(async () => {
    server = await createServer({
      logLevel: 'warn',
      root: `${dirname}/static`,
      plugins: [
        vitePluginConnectProxy({
          port: 1338
        })
      ]
    })
    await server.listen(1337)
  })
  afterEach(async () => {
    await server?.close()
  })

  it('still serves via dev-server', async () => {
    const response = await fetch('http://localhost:1337/index.html')
    expect(response.status).to.equal(200)
  })

  it('serves tunneled requests', async () => {
    const req = http.request({
      hostname: 'localhost',
      port: 1338,
      method: 'CONNECT'
    })
    req.end()

    const response =  await new Promise<string>(resolve => {
      req.on('connect', (_res, socket) => {
        socket.write([
          'GET /index.html HTTP/1.1',
          'Host: page.example',
          'Connection: close',
          '\r\n',
        ].join('\r\n'))

        let data = ''
        socket.on('data', chunk => {
          data += chunk.toString()
        })
        socket.on('end', () => resolve(data))
      })
    })
    expect(response).to.include('HTTP/1.1 200 OK')
  })
})
