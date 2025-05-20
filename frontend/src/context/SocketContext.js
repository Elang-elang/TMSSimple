// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import PropTypes from 'prop-types';

// Create context
const SocketContext = createContext();

/**
 * SocketProvider Component
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.url] - Socket.IO server URL
 */
export const SocketProvider = ({ children, url }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Initialize socket connection
  const initSocket = useCallback(() => {
    const socketUrl = url || process.env.REACT_APP_BACKEND_URL;
    
    if (!socketUrl) {
      console.error('Socket server URL is not defined');
      setConnectionError('Server configuration error');
      return null;
    }

    const newSocket = io(socketUrl, {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      autoConnect: true,
      transports: ['websocket'],
      query: {
        clientType: 'web'
      }
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, need manual reconnect
        setTimeout(() => {
          newSocket.connect();
        }, 1000);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnectionError(err.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      setConnectionError('Unable to reconnect to server');
    });

    return newSocket;
  }, [url]);

  // Effect to manage socket lifecycle
  useEffect(() => {
    const newSocket = initSocket();
    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.disconnect();
      }
    };
  }, [initSocket]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
      setConnectionError(null);
    }
  }, [socket]);

  // Context value
  const contextValue = {
    socket,
    isConnected,
    connectionError,
    reconnect,
    emitEvent: (event, data, callback) => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket not connected'));
          return;
        }

        socket.emit(event, data, (response) => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        });
      });
    }
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
  url: PropTypes.string
};

/**
 * Custom hook to access socket context
 * @returns {object} Socket context value
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }

  return context;
};

// Utility function for API-like socket calls
export const socketRequest = (event, data) => {
  return new Promise((resolve, reject) => {
    const socket = io(process.env.REACT_APP_BACKEND_URL);
    
    if (!socket.connected) {
      socket.connect();
    }

    const timeout = setTimeout(() => {
      socket.off(event);
      socket.disconnect();
      reject(new Error('Request timeout'));
    }, 10000);

    socket.emit(event, data, (response) => {
      clearTimeout(timeout);
      socket.disconnect();
      
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};
