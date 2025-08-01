// Enhanced Card Components - Professional Container Elements
import React from 'react';
import Icon from '../Icon';

// Base Card Component
export const Card = ({
    children,
    variant = 'default',
    hover = true,
    className = '',
    ...props
}) => {
    const variants = {
        default: 'glass-panel rounded-xl',
        elevated: 'card-elevated',
        flat: 'bg-slate-800/50 border border-slate-700/50 rounded-xl',
        gradient: 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl'
    };

    const hoverClass = hover ? 'hover:shadow-glow transition-all duration-300' : '';

    return (
        <div
            className={`${variants[variant]} ${hoverClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Card Header
export const CardHeader = ({
    title,
    subtitle,
    icon,
    action,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`flex items-center justify-between p-6 border-b border-slate-700/50 ${className}`}
            {...props}
        >
            <div className="flex items-center space-x-3">
                {icon && (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Icon name={icon} size={20} className="text-white" />
                    </div>
                )}
                <div>
                    <h3 className="text-xl font-bold text-white font-display">{title}</h3>
                    {subtitle && (
                        <p className="text-slate-400 text-sm">{subtitle}</p>
                    )}
                </div>
            </div>
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
};

// Card Content
export const CardContent = ({ children, className = '', ...props }) => {
    return (
        <div className={`p-6 ${className}`} {...props}>
            {children}
        </div>
    );
};

// Card Footer
export const CardFooter = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`p-6 pt-0 border-t border-slate-700/50 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Metric Card
export const MetricCard = ({
    title,
    value,
    change,
    changeType = 'neutral',
    icon,
    className = '',
    ...props
}) => {
    const changeColors = {
        positive: 'text-emerald-400',
        negative: 'text-red-400',
        neutral: 'text-slate-400'
    };

    return (
        <Card variant="elevated" className={`p-6 ${className}`} {...props}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-slate-400 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 ${changeColors[changeType]}`}>
                            {change}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Icon name={icon} size={24} className="text-green-400" />
                    </div>
                )}
            </div>
        </Card>
    );
};

// Status Card
export const StatusCard = ({
    status = 'success',
    title,
    message,
    icon,
    action,
    className = '',
    ...props
}) => {
    const statusStyles = {
        success: {
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            icon: 'text-emerald-400',
            title: 'text-emerald-400'
        },
        warning: {
            bg: 'bg-green-500/10 border-green-500/20',
            icon: 'text-green-400',
            title: 'text-green-400'
        },
        error: {
            bg: 'bg-red-500/10 border-red-500/20',
            icon: 'text-red-400',
            title: 'text-red-400'
        },
        info: {
            bg: 'bg-green-500/10 border-green-500/20',
            icon: 'text-green-400',
            title: 'text-green-400'
        }
    };

    const style = statusStyles[status];

    return (
        <Card
            variant="flat"
            className={`p-6 ${style.bg} border ${className}`}
            {...props}
        >
            <div className="flex items-start space-x-4">
                {icon && (
                    <Icon name={icon} size={24} className={style.icon} />
                )}
                <div className="flex-1">
                    <h4 className={`font-semibold mb-2 ${style.title}`}>{title}</h4>
                    <p className="text-slate-300 leading-relaxed">{message}</p>
                    {action && (
                        <div className="mt-4">{action}</div>
                    )}
                </div>
            </div>
        </Card>
    );
};

// Loading Card
export const LoadingCard = ({ title = 'Loading...', className = '' }) => {
    return (
        <Card className={`p-8 ${className}`}>
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">{title}</p>
            </div>
        </Card>
    );
};

// Feature Card
export const FeatureCard = ({
    icon,
    title,
    description,
    badge,
    onClick,
    className = '',
    ...props
}) => {
    return (
        <Card
            variant="elevated"
            className={`p-6 cursor-pointer group ${className}`}
            onClick={onClick}
            {...props}
        >
            <div className="text-center">
                <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon name={icon} size={32} className="text-white" />
                    </div>
                    {badge && (
                        <div className="absolute -top-2 -right-2 px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
                            {badge}
                        </div>
                    )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </Card>
    );
};

export default {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    MetricCard,
    StatusCard,
    LoadingCard,
    FeatureCard
};
