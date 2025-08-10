// Centralized WebSocket Connection Manager
// Prevents multiple WebSocket connections and provides unified event handling

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
        this.url = null;
        this.connectionPromise = null;
    }

    // Connect to WebSocket with automatic retry logic
    connect(url) {
        // If already connected to the correct URL, return existing connection
        if (this.socket?.readyState === WebSocket.OPEN && this.url === url) {
            console.log('🔗 WebSocket already connected to correct URL');
            return Promise.resolve();
        }

        // If a connection attempt is in progress, return the existing promise
        if (this.isConnecting && this.url === url && this.connectionPromise) {
            console.log('🔄 WebSocket connection in progress');
            return this.connectionPromise;
        }

        // Clean up any existing connection before starting a new one
        if (this.socket) {
            console.log('🧹 Cleaning up existing WebSocket connection');
            this.disconnect();
        }

        this.url = url;
        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    console.log('🚀 WebSocket connected successfully');
                    this.connectionAttempts = 0;
                    this.isConnecting = false;
                    this.notifyListeners('connected', { status: 'connected' });
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.notifyListeners('message', data);
                        
                        // Route to specific event types
                        if (data.type) {
                            this.notifyListeners(data.type, data);
                        }
                    } catch (error) {
                        console.error('❌ Failed to parse WebSocket message:', error);
                        this.notifyListeners('error', { error: 'Failed to parse message' });
                    }
                };

                this.socket.onclose = (event) => {
                    console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    this.notifyListeners('disconnected', { code: event.code, reason: event.reason });
                    
                    // Attempt reconnection if not intentional
                    if (!event.wasClean && this.connectionAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                this.socket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    this.notifyListeners('error', { error: 'Connection error' });
                    reject(error);
                };

            } catch (error) {
                console.error('❌ Failed to create WebSocket connection:', error);
                this.isConnecting = false;
                this.connectionPromise = null;
                reject(error);
            }
        });
    }

    // Schedule reconnection attempt
    scheduleReconnect() {
        if (this.isConnecting) {
            return; // Don't schedule reconnect if already connecting
        }

        this.connectionAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1),
            30000 // Max 30 second delay
        );
        
        console.log(`🔄 Scheduling reconnection attempt ${this.connectionAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            if (this.url && this.connectionAttempts <= this.maxReconnectAttempts) {
                this.connect(this.url);
            }
        }, delay);
    }

    // Send message through WebSocket
    send(data) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('❌ Failed to send WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('⚠️ WebSocket not connected, cannot send message');
            return false;
        }
    }

    // Add event listener
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Return cleanup function
        return () => {
            this.removeEventListener(event, callback);
        };
    }

    // Remove event listener
    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    // Notify all listeners for an event
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in WebSocket event listener for ${event}:`, error);
                }
            });
        }
    }

    // Get connection status
    getConnectionStatus() {
        if (!this.socket) return 'disconnected';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    // Check if connected
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    // Gracefully disconnect
    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting WebSocket...');
            this.socket.close(1000, 'Client disconnect');
            this.socket = null;
        }
        this.listeners.clear();
        this.connectionAttempts = 0;
        this.isConnecting = false;
        this.connectionPromise = null;
    }

    // Get connection stats
    getStats() {
        return {
            status: this.getConnectionStatus(),
            connectionAttempts: this.connectionAttempts,
            listenersCount: this.listeners.size,
            url: this.url
        };
    }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
export default wsManager;
