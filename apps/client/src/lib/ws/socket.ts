import type { WsMessage } from '@algorym/shared-types'

export interface WsClientOptions {
  url: string
  token: string
  onMessage: (message: WsMessage) => void
  onOpen?: () => void
  onClose?: () => void
}

export class WsClient {
  private socket: WebSocket | null = null
  private readonly options: WsClientOptions
  private reconnectDelay = 1000
  private closedByUser = false

  constructor(options: WsClientOptions) {
    this.options = options
  }

  connect() {
    this.closedByUser = false
    this.socket = new WebSocket(this.options.url)
    this.socket.onopen = () => {
      this.reconnectDelay = 1000
      this.options.onOpen?.()
    }
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage
        this.options.onMessage(message)
      } catch {
        /* ignore malformed frames */
      }
    }
    this.socket.onclose = () => {
      this.options.onClose?.()
      if (!this.closedByUser) {
        setTimeout(() => this.connect(), this.reconnectDelay)
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
      }
    }
    this.socket.onerror = () => this.socket?.close()
  }

  send(message: WsMessage) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  close() {
    this.closedByUser = true
    this.socket?.close()
    this.socket = null
  }
}

/** Build a ws:// or wss:// URL from the current origin + session token. */
export function buildWsUrl(path: string, token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}?token=${encodeURIComponent(token)}`
}