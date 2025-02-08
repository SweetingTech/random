import { io, Socket } from 'socket.io-client';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private static isElectron: boolean = !!(window && window.electron);

  private constructor() {
    // Don't auto-connect on instantiation
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public async connect() {
    // Only connect in Electron environment
    if (!SocketManager.isElectron) {
      console.log('Not connecting socket in non-Electron environment');
      return;
    }

    if (this.socket || this.isConnecting) {
      console.log('Socket connect() call ignored because already connected or connecting.');
      return;
    }

    this.isConnecting = true;
    const port = import.meta.env.VITE_SOCKET_SERVER_PORT || '3000';
    const baseUrl = `http://localhost:${port}`;

    try {
      this.socket = io(baseUrl, {
        reconnectionDelay: 1000,
        reconnection: false, // Don't auto-reconnect
        transports: ['polling', 'websocket'],
        withCredentials: true,
        autoConnect: true,
        forceNew: true,
        timeout: 2000 // Short timeout for quick failure
      });

      this.socket.on('connect', () => {
        console.log('Socket connected to server.');
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.log('Socket connection error: Server not available. Running in offline mode.');
        this.isConnecting = false;
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
      });
    } catch (error) {
      console.error('Socket initialization failed:', error);
      console.log('Failed to initialize socket connection. Running in offline mode.');
      this.isConnecting = false;
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket emit('${event}') - not connected.`);
    }
  }

  public on(event: string, callback: (data: any) => void) {
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    } else {
      console.warn(`Socket on('${event}') - not connected.`);
    }
  }

  public off(event: string) {
    if (this.socket?.connected) {
      this.socket.off(event);
    } else {
      console.warn(`Socket off('${event}') - not connected.`);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log('Socket disconnected.');
    } else {
      console.log('No socket to disconnect.');
    }
    this.isConnecting = false;
  }
}

export default SocketManager;
