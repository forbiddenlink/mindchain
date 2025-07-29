import React from 'react';
import Icon from './Icon';

const Header = ({ connectionStatus = 'Disconnected', backendHealth = 'unknown' }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Connected':
            case 'healthy':
                return 'text-emerald-400';
            case 'Disconnected':
            case 'error':
                return 'text-red-400';
            default:
                return 'text-amber-400';
        }
    };

    return (
        <header className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-xl">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo and Title */}
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Icon name="brain" size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                MindChain
                            </h1>
                            <p className="text-slate-400 text-sm font-medium">AI Debate Engine</p>
                        </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center space-x-6">
                        {/* Connection Status */}
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-slate-400 text-sm">WebSocket</span>
                                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'
                                        }`}></div>
                                    <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                                        {connectionStatus}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-slate-400 text-sm">Backend</span>
                                    <div className={`w-2 h-2 rounded-full ${backendHealth === 'healthy' ? 'bg-emerald-400' : 'bg-red-400'
                                        }`}></div>
                                    <span className={`text-sm font-medium ${getStatusColor(backendHealth)}`}>
                                        {backendHealth}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Live Indicator */}
                        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
                            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'Connected' && backendHealth === 'healthy'
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-red-400'
                                }`}></div>
                            <span className="text-slate-300 text-sm font-medium">
                                Redis Challenge 2025
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
