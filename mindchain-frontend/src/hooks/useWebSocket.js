import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [lastMessage, setLastMessage] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('🔌 Connected to MindChain server');
            setConnectionStatus('Connected');
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
                setMessages(prev => [...prev, data]);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('🔌 Disconnected from MindChain server');
            setConnectionStatus('Disconnected');
            setSocket(null);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnectionStatus('Error');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [url]);

    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    };

    return {
        socket,
        connectionStatus,
        lastMessage,
        messages,
        sendMessage
    };
};

export default useWebSocket;
