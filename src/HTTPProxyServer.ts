import EventEmitter from 'node:events'
import http from 'node:http'
import net from 'node:net'

export default class HTTPProxyServer extends EventEmitter {
  private target: http.Server
  private internalServer: http.Server

  constructor (target: http.Server) {
    super()

    this.target = target
    this.internalServer = http.createServer()
    this.internalServer.on('connect', this.onConnect.bind(this))
    this.internalServer.on('error', this.handleError.bind(this))
  }

  async open (port: number): Promise<void> {
    return new Promise(resolve => {
      this.internalServer.listen(port, () => {
        resolve()
      })
    })
  }

  async close (): Promise<void> {
    return new Promise(resolve => {
      this.internalServer.close(() => {
        resolve()
      })
    })
  }

  createConnection (): Promise<net.Socket> {
    return new Promise(resolve => {
      const { port } = this.target.address() as net.AddressInfo
      const connection = net.connect(port, '127.0.0.1', () => {
        resolve(connection)
      })
      connection.setTimeout(5000)
      connection.on('error', this.handleError)
    })
  }

  async onConnect (_req: http.IncomingMessage, client: net.Socket, head: Buffer) {
    const connection = await this.createConnection()
    client.write('HTTP/1.1 200 OK\r\n\r\n')
    connection.write(head)
    client.pipe(connection)
    connection.pipe(client)
  }

  handleError (err: Error) {
    this.emit('error', err)
  }
}