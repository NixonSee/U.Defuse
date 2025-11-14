import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private maxReconnectAttempts = 5;

  async connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      try {
        // Resolve Socket.IO server URL
        const resolveSocketUrl = () => {
          // Explicit override (e.g., Render/Railway backend)
          if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;

          const hostname = window.location.hostname;
          const isLocal = (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            /^10\./.test(hostname) ||
            /^192\.168\./.test(hostname)
          );
          if (isLocal) return `http://${hostname}:5000`;

          // Production default: same origin (avoids mixed-content/CSP issues)
          return window.location.origin;
        };
        const socketUrl = resolveSocketUrl();
        console.log('🔌 Creating Socket.IO connection to:', socketUrl);
        
        // Create socket connection - cookies will be sent automatically
        this.socket = io(socketUrl, {
          withCredentials: true, // Enable sending cookies
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        // Connection successful
        this.socket.on('connect', () => {
          console.log('✅ Connected to Socket.IO server, Socket ID:', this.socket?.id);
          resolve(this.socket!);
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error.message);
          console.error('❌ Full error object:', error);
          
          if (error.message.includes('Authentication error')) {
            reject(new Error('Authentication failed. Please login again.'));
          } else {
            reject(error);
          }
        });

        // Reconnection attempts
        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
        });

        // Reconnection failed
        this.socket.on('reconnect_failed', () => {
          console.error('❌ Failed to reconnect to server');
          this.disconnect();
        });

        // Disconnect
        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Disconnected from server:', reason);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 Socket disconnected');
    }
  }

  // Player events
  onPlayersUpdate(callback: (data: any) => void) {
    this.socket?.on('playersUpdate', (data) => {
      console.log('Socket received playersUpdate:', data);
      callback(data);
    });
  }

  onWelcome(callback: (data: any) => void) {
    this.socket?.on('welcome', callback);
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('newMessage', callback);
  }

  // Send events
  sendMessage(message: string) {
    this.socket?.emit('playerMessage', { message });
  }

  requestPlayerList() {
    console.log('📋 Requesting current player list from server');
    this.socket?.emit('requestPlayerList');
  }

  // Game room events
  createRoom(roomCode: string) {
    console.log('🏠 Creating room:', roomCode);
    this.socket?.emit('createRoom', { roomCode });
  }

  joinRoom(roomCode: string) {
    console.log('🚪 Joining room:', roomCode);
    this.socket?.emit('joinRoom', { roomCode });
  }

  leaveRoom() {
    console.log('🚪 Leaving room');
    this.socket?.emit('leaveRoom');
  }

  toggleReady() {
    console.log('🎮 Toggling ready status');
    this.socket?.emit('toggleReady');
  }

  startGame() {
    console.log('🎮 Starting game');
    this.socket?.emit('startGame');
  }

  // Room event listeners
  onRoomCreated(callback: (data: any) => void) {
    this.socket?.off('roomCreated'); // Remove old listener
    this.socket?.on('roomCreated', callback);
  }

  onPlayerJoined(callback: (data: any) => void) {
    this.socket?.off('playerJoined'); // Remove old listener
    this.socket?.on('playerJoined', callback);
  }

  onPlayerLeft(callback: (data: any) => void) {
    this.socket?.off('playerLeft'); // Remove old listener
    this.socket?.on('playerLeft', callback);
  }

  onPlayerReady(callback: (data: any) => void) {
    this.socket?.off('playerReady'); // Remove old listener
    this.socket?.on('playerReady', callback);
  }

  onRoomError(callback: (data: any) => void) {
    this.socket?.off('roomError'); // Remove old listener
    this.socket?.on('roomError', callback);
  }

  onRoomClosed(callback: (data: any) => void) {
    this.socket?.off('roomClosed'); // Remove old listener
    this.socket?.on('roomClosed', callback);
  }

  onGameStarted(callback: (data: any) => void) {
    this.socket?.off('gameStarted'); // Remove old listener
    this.socket?.on('gameStarted', callback);
  }

  // Remove listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  removeListener(event: string) {
    this.socket?.off(event);
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export a singleton instance
export const socketService = new SocketService();
export default socketService;

// Export socket getter for components (ensures socket is ready)
export const getSocket = () => socketService.getSocket();

// For backward compatibility, export socket proxy
export const socket = {
  emit: (event: string, ...args: any[]) => socketService.getSocket()?.emit(event, ...args),
  on: (event: string, callback: (...args: any[]) => void) => socketService.getSocket()?.on(event, callback),
  off: (event: string, callback?: (...args: any[]) => void) => socketService.getSocket()?.off(event, callback),
  once: (event: string, callback: (...args: any[]) => void) => socketService.getSocket()?.once(event, callback),
};