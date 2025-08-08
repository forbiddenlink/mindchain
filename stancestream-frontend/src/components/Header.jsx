import React from 'react';
import Icon from './Icon';
import { Container, Flex } from './ui';

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
                return 'text-green-400';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Connected':
            case 'healthy':
                return 'bg-green-400 shadow-glow animate-pulse';
            case 'Disconnected':
            case 'error':
                return 'bg-red-400';
            default:
                return 'bg-green-400 animate-pulse';
        }
    };

    return (
        <header className="bg-gray-900/95 border-b border-green-500/30 shadow-2xl shadow-green-500/10 sticky top-0 z-50 animate-slide-in-down backdrop-blur-sm">
            <Container maxWidth="max-w-7xl" padding="px-2 sm:px-4 lg:px-8">
                <Flex justify="between" align="center" className="h-14 sm:h-16 lg:h-20">
                    {/* Matrix Logo and Title */}
                    <Flex align="center" gap="gap-2 sm:gap-3 lg:gap-4" className="min-w-0 flex-1 sm:flex-none">
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-600/20 to-black/80 border border-green-500/30 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 transform hover:scale-105 transition-all duration-300 hover:shadow-green-500/40">
                                <Icon name="activity" size={20} className="text-green-400 sm:hidden" />
                                <Icon name="activity" size={24} className="text-green-400 hidden sm:block" />
                            </div>
                            {/* Matrix glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-lg sm:rounded-xl opacity-40 blur-lg -z-10"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent font-mono tracking-wider">
                                STANCESTREAM
                            </h1>
                            <p className="text-gray-400 text-xs sm:text-sm lg:text-base font-medium font-mono">
                                REDIS AI CHALLENGE 2025
                            </p>
                        </div>
                    </Flex>

                    {/* Matrix Status Indicators */}
                    <Flex align="center" gap="gap-2 sm:gap-4 lg:gap-6" className="flex-shrink-0">
                        {/* Connection Status Grid - Hidden on small screens */}
                        <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                            {/* WebSocket Status */}
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="text-right">
                                    <div className="flex items-center space-x-1 lg:space-x-2">
                                        <span className="text-gray-400 text-xs lg:text-sm font-medium font-mono">WEBSOCKET</span>
                                        <div className={`status-indicator ${connectionStatus === 'Connected' ? 'online' : 'offline'}`}></div>
                                    </div>
                                </div>
                                <span className={`text-xs lg:text-sm font-semibold font-mono ${getStatusColor(connectionStatus)}`}>
                                    {connectionStatus.toUpperCase()}
                                </span>
                            </div>

                            {/* Backend Status */}
                            <div className="flex items-center space-x-2 lg:space-x-3">
                                <div className="text-right">
                                    <div className="flex items-center space-x-1 lg:space-x-2">
                                        <span className="text-gray-400 text-xs lg:text-sm font-medium font-mono">BACKEND</span>
                                        <div className={`status-indicator ${backendHealth === 'healthy' ? 'online' : 'offline'}`}></div>
                                    </div>
                                </div>
                                <span className={`text-xs lg:text-sm font-semibold font-mono ${getStatusColor(backendHealth)}`}>
                                    {backendHealth === 'healthy' ? 'HEALTHY' : 'ERROR'}
                                </span>
                            </div>
                        </div>

                        {/* Matrix Live Indicator - Responsive sizing */}
                        <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-900/80 border border-green-500/30 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg hover:border-green-500/50 transition-all duration-300 backdrop-blur-sm">
                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${connectionStatus === 'Connected' && backendHealth === 'healthy'
                                    ? 'bg-green-400 shadow-glow animate-pulse'
                                    : 'bg-red-400'
                                }`}></div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-green-300 text-xs sm:text-sm font-semibold font-mono">
                                    PLATFORM READY
                                </span>
                                <span className="text-gray-400 text-xs hidden sm:block font-mono">
                                    {connectionStatus === 'Connected' && backendHealth === 'healthy'
                                        ? 'ALL SYSTEMS ONLINE'
                                        : 'SYSTEM CHECK REQUIRED'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Mobile Status Indicator - Only for very small screens */}
                        <div className="md:hidden flex items-center space-x-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(connectionStatus)}`}></div>
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(backendHealth)}`}></div>
                        </div>
                    </Flex>
                </Flex>
            </Container>

            {/* Matrix bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
        </header>
    );
};

export default Header;
