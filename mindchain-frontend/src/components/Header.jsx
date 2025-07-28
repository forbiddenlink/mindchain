import React from 'react';

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
                            {/* Advanced Neural Network Icon */}
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                {/* Input Layer */}
                                <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
                                <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
                                
                                {/* Hidden Layer 1 */}
                                <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
                                
                                {/* Output Layer */}
                                <circle cx="20" cy="8" r="1.5" fill="currentColor"/>
                                <circle cx="20" cy="12" r="1.5" fill="currentColor"/>
                                <circle cx="20" cy="16" r="1.5" fill="currentColor"/>
                                
                                {/* Neural Connections */}
                                <path d="M5.5 6L10.5 4" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                <path d="M5.5 6L10.5 8" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                <path d="M5.5 6L10.5 12" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>
                                
                                <path d="M5.5 12L10.5 8" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                <path d="M5.5 12L10.5 12" stroke="currentColor" strokeWidth="0.8" opacity="0.8"/>
                                <path d="M5.5 12L10.5 16" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                
                                <path d="M5.5 18L10.5 16" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                <path d="M5.5 18L10.5 20" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                
                                <path d="M13.5 4L18.5 8" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
                                <path d="M13.5 8L18.5 8" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
                                <path d="M13.5 8L18.5 12" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                
                                <path d="M13.5 12L18.5 8" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>
                                <path d="M13.5 12L18.5 12" stroke="currentColor" strokeWidth="0.8" opacity="0.8"/>
                                <path d="M13.5 12L18.5 16" stroke="currentColor" strokeWidth="0.8" opacity="0.6"/>
                                
                                <path d="M13.5 16L18.5 12" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
                                <path d="M13.5 16L18.5 16" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
                                
                                <path d="M13.5 20L18.5 16" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>
                            </svg>
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
