import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Global socket instance to prevent multiple connections
let globalSocket: Socket | null = null;
let isConnecting = false; // Prevent multiple simultaneous connection attempts

export const useSocket = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('🔧 useSocket useEffect triggered with userId:', userId);
    console.log('🔍 Current global socket state:', {
      exists: !!globalSocket,
      connected: globalSocket?.connected,
      disconnected: globalSocket?.disconnected,
      isConnecting
    });

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      console.log('⏳ Connection already in progress, waiting...');
      return;
    }

    // Use existing global socket or create new one (with proper deduplication)
    if (!globalSocket || globalSocket.disconnected) {
      if (isConnecting) return; // Double check
      
      isConnecting = true;
      console.log('🔌 Creating new Socket.IO connection with spam prevention');
      
      try {
        globalSocket = io('http://localhost:5000', {
          transports: ['websocket', 'polling'],
          // Add connection options to prevent spam
          forceNew: false,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000
        });
        
        console.log('✅ Socket.IO instance created:', !!globalSocket);
        
        // Reset connecting flag when connection is established
        globalSocket.on('connect', () => {
          console.log('🔌 Socket connected successfully:', globalSocket?.id);
          isConnecting = false;
        });
        
        globalSocket.on('disconnect', () => {
          console.log('🔌 Socket disconnected');
          isConnecting = false;
        });
        
        globalSocket.on('connect_error', (error) => {
          console.log('❌ Socket connection error:', error);
          isConnecting = false;
        });
        
      } catch (error) {
        console.log('❌ Error creating socket:', error);
        isConnecting = false;
      }
      
    } else {
      console.log('🔌 Reusing existing Socket.IO connection');
    }

    // Always assign the global socket to the ref
    socketRef.current = globalSocket;
    const socket = socketRef.current;

    // Add debug logging to see what's happening
    console.log('🔍 Socket assignment result:', {
      globalSocketExists: !!globalSocket,
      socketRefExists: !!socketRef.current,
      socketExists: !!socket,
      connected: socket?.connected,
      hasConnectListeners: socket?.hasListeners?.('connect'),
      userId
    });

    // If we still don't have a socket, something is very wrong
    if (!socket) {
      console.log('❌ CRITICAL: No socket available after assignment!');
      return;
    }

    // Only add event listeners if this is a new connection
    if (!socket.hasListeners('connect')) {
      console.log('🔧 Adding new event listeners');
      socket.on('connect', () => {
        console.log('🔌 Connected to server:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
      });

      socket.on('connect_error', (error) => {
        console.log('❌ Connection error:', error);
      });
    } else {
      console.log('🔧 Event listeners already exist, skipping');
    }

    // Always try to join user room if connected and userId provided
    if (userId && socket.connected) {
      socket.emit('join-user-room', userId);
      console.log(`👤 Joined user room: user-${userId}`);
    } else if (userId) {
      // If not connected yet, wait for connection
      socket.once('connect', () => {
        socket.emit('join-user-room', userId);
        console.log(`👤 Joined user room: user-${userId}`);
      });
    }

    // Cleanup on unmount
    return () => {
      console.log('🔌 Socket cleanup (keeping connection alive for reuse)');
      // Don't disconnect global socket - let other components reuse it
      // socket.disconnect();
    };
  }, [userId]);

  // Re-enabled Socket.IO functions with proper error handling
  const joinConversation = (conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join-conversation', conversationId);
      console.log(`💬 Joined conversation: ${conversationId}`);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave-conversation', conversationId);
      console.log(`👋 Left conversation: ${conversationId}`);
    }
  };

  const onNewMessage = (callback: (data: any) => void) => {
    console.log('🔍 onNewMessage called:', {
      socketExists: !!socketRef.current,
      connected: socketRef.current?.connected,
      callbackType: typeof callback
    });
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.on('new-message', callback);
      console.log('🔔 Listening for new messages (immediate)');
    } else if (socketRef.current) {
      console.log('⏳ Socket not connected, waiting for connection...');
      // Wait for connection if not connected yet
      socketRef.current.once('connect', () => {
        socketRef.current!.on('new-message', callback);
        console.log('🔔 Listening for new messages (after connection)');
      });
    } else {
      console.log('❌ No socket available for onNewMessage');
    }
  };

  const offNewMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('new-message');
      console.log('🔕 Stopped listening for new messages');
    }
  };

  const onMessagesRead = (callback: (data: any) => void) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.on('messages-read', callback);
      console.log('👀 Listening for messages read events');
    } else if (socketRef.current) {
      // Wait for connection if not connected yet
      socketRef.current.once('connect', () => {
        socketRef.current!.on('messages-read', callback);
        console.log('👀 Listening for messages read events (after connection)');
      });
    }
  };

  const offMessagesRead = () => {
    if (socketRef.current) {
      socketRef.current.off('messages-read');
      console.log('👀 Stopped listening for messages read events');
    }
  };

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    onMessagesRead,
    offMessagesRead
  };
};
