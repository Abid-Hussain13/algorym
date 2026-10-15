import type { WsClientMessage, WsMessage } from '@algorym/shared-types'
import { buildWsUrl } from '@/lib/session-urls'

/** Send a ping this often. */
const HEARTBEAT_INTERVAL = 60_000
/** No traffic at all for this long and we assume the socket is a zombie. . */
const HEARTBEAT_TIMEOUT = HEARTBEAT_INTERVAL * 2

export interface WsClientOptions {
    /** Path such as `/ws`; the origin is resolved from VITE_API_URL. . */
    path: string
    params: Record<string, string>
    onMessage: (message: WsMessage) => void
    onOpen?: () => void
    onClose?: () => void
}

/** Reconnectable JSON socket for `/ws`. . */
export class WsClient {
    private socket: WebSocket | null = null
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null
    private lastHeardAt = 0
    private readonly options: WsClientOptions
    private reconnectDelay = 1000
    private closedByUser = false

    constructor(options: WsClientOptions) {
        this.options = options
    }

    connect() {
        this.closedByUser = false
        const query = new URLSearchParams(this.options.params)
        this.socket = new WebSocket(buildWsUrl(`${this.options.path}?${query.toString()}`))

        this.socket.onopen = () => {
            this.reconnectDelay = 1000
            this.lastHeardAt = Date.now()
            this.startHeartbeat()
            this.options.onOpen?.()
        }

        this.socket.onmessage = (event) => {
            this.lastHeardAt = Date.now()
            try {
                const message = JSON.parse(event.data) as WsMessage
                this.options.onMessage(message)
            } catch {
                /* ignore malformed frames */
            }
        }

        this.socket.onclose = () => {
            this.stopHeartbeat()
            this.options.onClose?.()
            if (!this.closedByUser) {
                setTimeout(() => this.connect(), this.reconnectDelay)
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000)
            }
        }

        this.socket.onerror = () => this.socket?.close()
    }

    private startHeartbeat() {
        this.stopHeartbeat()
        this.heartbeatTimer = setInterval(() => {
            if (Date.now() - this.lastHeardAt > HEARTBEAT_TIMEOUT) {
                // Silence means the socket is lying about being open. Closing it
                // fires onclose, which schedules the reconnect above.
                this.socket?.close()
                return
            }
            this.send({ type: 'ping' })
        }, HEARTBEAT_INTERVAL)
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = null
    }

    send(message: WsClientMessage) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message))
        }
    }

    close() {
        this.closedByUser = true
        this.stopHeartbeat()
        this.socket?.close()
        this.socket = null
    }
}
