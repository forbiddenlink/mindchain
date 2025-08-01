// Professional Loading States - Enterprise Grade Feedback
import React from 'react';
import Icon from '../Icon';

// Skeleton Loader for Cards
export const CardSkeleton = ({ className = '' }) => {
    return (
        <div className={`glass-panel rounded-xl p-6 animate-pulse ${className}`}>
            <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-slate-700/50 rounded-xl"></div>
                <div className="flex-1">
                    <div className="h-4 bg-slate-700/50 rounded-lg w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-700/50 rounded-lg w-1/2"></div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-3 bg-slate-700/50 rounded-lg w-full"></div>
                <div className="h-3 bg-slate-700/50 rounded-lg w-5/6"></div>
                <div className="h-3 bg-slate-700/50 rounded-lg w-4/6"></div>
            </div>
        </div>
    );
};

// Chat Message Skeleton
export const MessageSkeleton = ({ isLeft = true, className = '' }) => {
    return (
        <div className={`flex items-start space-x-4 animate-pulse ${isLeft ? 'flex-row' : 'flex-row-reverse space-x-reverse'
            } ${className}`}>
            <div className="w-12 h-12 bg-slate-700/50 rounded-xl"></div>
            <div className={`flex-1 max-w-3xl ${isLeft ? 'mr-12' : 'ml-12'}`}>
                <div className={`flex items-center space-x-3 mb-2 ${isLeft ? 'justify-start' : 'justify-end'
                    }`}>
                    <div className="h-3 bg-slate-700/50 rounded-lg w-20"></div>
                    <div className="h-3 bg-slate-700/50 rounded-lg w-16"></div>
                </div>
                <div className={`glass-card p-4 rounded-2xl ${isLeft ? 'rounded-tl-md' : 'rounded-tr-md'
                    }`}>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-700/50 rounded-lg w-full"></div>
                        <div className="h-3 bg-slate-700/50 rounded-lg w-5/6"></div>
                        <div className="h-3 bg-slate-700/50 rounded-lg w-3/4"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Spinner Component
export const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    return (
        <div className={`${sizes[size]} ${className}`}>
            <div className="w-full h-full border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

// Loading Overlay
export const LoadingOverlay = ({
    message = 'Loading...',
    submessage,
    visible = false,
    className = ''
}) => {
    if (!visible) return null;

    return (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
            <div className="glass-panel rounded-2xl p-8 max-w-sm w-full mx-4">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse"></div>
                        <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                            <Icon name="brain" size={24} className="text-green-400 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
                    {submessage && (
                        <p className="text-slate-400 text-sm">{submessage}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Progress Bar
export const ProgressBar = ({
    progress = 0,
    label,
    showPercentage = true,
    variant = 'primary',
    className = ''
}) => {
    const variants = {
        primary: 'from-blue-500 to-purple-600',
        success: 'from-emerald-500 to-green-600',
        warning: 'from-yellow-500 to-orange-600',
        danger: 'from-red-500 to-pink-600'
    };

    return (
        <div className={className}>
            {(label || showPercentage) && (
                <div className="flex justify-between items-center mb-2">
                    {label && (
                        <span className="text-sm font-medium text-slate-300">{label}</span>
                    )}
                    {showPercentage && (
                        <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
                    )}
                </div>
            )}
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${variants[variant]} rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

// Pulsing Dot Loader
export const DotLoader = ({ className = '' }) => {
    return (
        <div className={`flex space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                ></div>
            ))}
        </div>
    );
};

// Loading Card Component
export const LoadingCard = ({
    title = 'Loading...',
    subtitle,
    icon = 'loader-2',
    className = ''
}) => {
    return (
        <div className={`glass-panel rounded-xl p-8 ${className}`}>
            <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full"></div>
                    <div className="w-full h-full flex items-center justify-center">
                        <Icon name={icon} size={32} className="text-green-400 animate-spin" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                {subtitle && (
                    <p className="text-slate-400 text-sm">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

export default {
    CardSkeleton,
    MessageSkeleton,
    Spinner,
    LoadingOverlay,
    ProgressBar,
    DotLoader,
    LoadingCard
};
