import EventEmitter from 'node:events'
import http from 'node:http'
import net from 'node:net'

export default class HTTPProxyServer extends EventEmitter {
  private readonly target: http.Server
  private readonly internalServer: http.Server

  constructor (target: http.Server) {
    super()

    this.target = target
    this.internalServer = http.createServer()
    this.internalServer.on('connect', this.onConnect.bind(this))
    this.internalServer.on('error', this.handleError.bind(this))
  }

  async open (port: number): Promise<void> {
    await new Promise<void>(resolve => {
      this.internalServer.listen(port, resolve)
    })
  }

  async close (): Promise<void> {
    await new Promise<void>(resolve => {
      this.internalServer.close(() => resolve)
    })
  }

  async createConnection (): Promise<net.Socket> {
    const socket = await new Promise<net.Socket>(resolve => {
      const { port, address, family } = this.target.address() as net.AddressInfo
      const host = family === 'IPv4'
        ? (address === '0.0.0.0' ? '127.0.0.1' : address)
        : (address === '::' ? '::1' : address)
      const connection = net.connect(port, host, () => {
        resolve(connection)
      })
      connection.setTimeout(5000)
      connection.on('error', this.handleError.bind(this))
    })
    return socket
  }

  onConnect (_req: http.IncomingMessage, client: net.Socket, head: Buffer): void {
    void this.createConnection().then(connection => {
      client.write('HTTP/1.1 200 OK\r\n\r\n')
      connection.write(head)
      client.pipe(connection)
      connection.pipe(client)
    })
  }

  handleError (err: Error): void {
    this.emit('error', err)
  }
}
