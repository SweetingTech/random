import { io, Socket } from 'socket.io-client';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;

  private constructor() {
    const port = '4000';
    const baseUrl = `http://localhost:${port}`;

    this.socket = io(baseUrl, {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      agent: false,
      upgrade: true,
      rejectUnauthorized: false
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default SocketManager;