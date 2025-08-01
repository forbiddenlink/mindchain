import React from 'react';
import Icon from './Icon';
import { Container, Flex } from './ui';

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

    const getStatusDot = (status) => {
        switch (status) {
            case 'Connected':
            case 'healthy':
                return 'bg-emerald-400 shadow-glow animate-pulse';
            case 'Disconnected':
            case 'error':
                return 'bg-red-400';
            default:
                return 'bg-amber-400 animate-pulse';
        }
    };

    return (
        <header className="glass-panel border-b border-slate-700/50 shadow-elevated sticky top-0 z-50 animate-slide-in-down">
            <Container maxWidth="max-w-7xl" padding="px-4 lg:px-8">
                <Flex justify="between" align="center" className="h-16 lg:h-20">
                    {/* Enhanced Logo and Title */}
                    <Flex align="center" gap="gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-glow">
                                <Icon name="brain" size={24} className="text-white" />
                            </div>
                            {/* Subtle glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-xl opacity-20 blur-lg -z-10"></div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl lg:text-3xl font-bold text-gradient font-display">
                                MindChain
                            </h1>
                            <p className="text-slate-400 text-sm lg:text-base font-medium">
                                Redis AI Challenge 2025
                            </p>
                        </div>
                    </Flex>

                    {/* Enhanced Status Indicators */}
                    <Flex align="center" gap="gap-6">
                        {/* Connection Status Grid */}
                        <div className="hidden sm:flex items-center space-x-6">
                            {/* WebSocket Status */}
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-slate-400 text-sm font-medium">WebSocket</span>
                                        <div className={`status-indicator ${connectionStatus === 'Connected' ? 'online' : 'offline'}`}></div>
                                    </div>
                                </div>
                                <span className={`text-sm font-semibold ${getStatusColor(connectionStatus)}`}>
                                    {connectionStatus}
                                </span>
                            </div>

                            {/* Backend Status */}
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-slate-400 text-sm font-medium">Backend</span>
                                        <div className={`status-indicator ${backendHealth === 'healthy' ? 'online' : 'offline'}`}></div>
                                    </div>
                                </div>
                                <span className={`text-sm font-semibold ${getStatusColor(backendHealth)}`}>
                                    {backendHealth === 'healthy' ? 'Healthy' : 'Error'}
                                </span>
                            </div>
                        </div>

                        {/* Compact Live Indicator */}
                        <div className="flex items-center space-x-3 glass-card px-4 py-2 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-all duration-300">
                            <div className={`w-3 h-3 rounded-full ${
                                connectionStatus === 'Connected' && backendHealth === 'healthy'
                                    ? 'bg-emerald-400 shadow-glow animate-pulse'
                                    : 'bg-red-400'
                            }`}></div>
                            <div className="flex flex-col">
                                <span className="text-slate-200 text-sm font-semibold">
                                    Contest Ready
                                </span>
                                <span className="text-slate-400 text-xs">
                                    {connectionStatus === 'Connected' && backendHealth === 'healthy' 
                                        ? 'All Systems Online' 
                                        : 'System Check Required'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Mobile Status Indicator */}
                        <div className="sm:hidden flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusDot(connectionStatus)}`}></div>
                            <div className={`w-3 h-3 rounded-full ${getStatusDot(backendHealth)}`}></div>
                        </div>
                    </Flex>
                </Flex>
            </Container>
            
            {/* Subtle bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/20 to-transparent"></div>
        </header>
    );
};

export default Header;
