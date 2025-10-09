import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Connected to server:', socket.id);
      
      // Join user's personal room if userId is provided
      if (userId) {
        socket.emit('join-user-room', userId);
        console.log(`👤 Joined user room: user-${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        console.log('🔌 Socket disconnected on cleanup');
      }
    };
  }, [userId]);

  // Join conversation room
  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-conversation', conversationId);
      console.log(`💬 Joined conversation: ${conversationId}`);
    }
  };

  // Leave conversation room
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-conversation', conversationId);
      console.log(`👋 Left conversation: ${conversationId}`);
    }
  };

  // Listen for new messages
  const onNewMessage = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new-message', callback);
    }
  };

  // Remove message listener
  const offNewMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('new-message');
    }
  };

  // Listen for messages read updates
  const onMessagesRead = (callback: (data: any) => void) => {
    if (socketRef.current) {
      console.log('🔧 Registering messages-read listener');
      socketRef.current.on('messages-read', callback);
    }
  };

  // Remove messages read listener
  const offMessagesRead = () => {
    if (socketRef.current) {
      socketRef.current.off('messages-read');
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
