import React from 'react';

const Header = ({ connectionStatus = 'Disconnected', backendHealth = 'unknown' }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Connected':
            case 'healthy':
                return 'text-green-400';
            case 'Disconnected':
            case 'error':
                return 'text-red-400';
            default:
                return 'text-yellow-400';
        }
    };

    return (
        <header className="w-full bg-gradient-to-r from-[#1a1a1a] to-[#2b2b2b] text-white py-4 shadow-md border-b border-neutral-700">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        MC
                    </div>
                    <h1 className="text-2xl font-semibold tracking-wide">
                        MindChain Debate Engine
                    </h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-right">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">WebSocket:</span>
                            <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                                {connectionStatus}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Backend:</span>
                            <span className={`text-sm font-medium ${getStatusColor(backendHealth)}`}>
                                {backendHealth}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                            connectionStatus === 'Connected' && backendHealth === 'healthy' 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm text-gray-400">Redis AI Challenge · 2025</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
