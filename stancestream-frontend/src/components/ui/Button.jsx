// Enhanced Button Components - Professional Grade UI Elements
import React from 'react';
import Icon from '../Icon';

// Base Button Component with Multiple Variants
export const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'professional-button focus-ring interactive-scale';

    const variants = {
        primary: 'button-primary',
        secondary: 'button-secondary',
        ghost: 'button-ghost',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl',
        success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl',
        warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
        xl: 'px-8 py-4 text-lg rounded-xl'
    };

    const variantClass = variants[variant] || variants.primary;
    const sizeClass = sizes[size] || sizes.md;

    return (
        <button
            className={`${baseClasses} ${variantClass} ${sizeClass} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <Icon name="loader-2" size={16} className="animate-spin mr-2" />
            )}
            {icon && iconPosition === 'left' && !loading && (
                <Icon name={icon} size={16} className="mr-2" />
            )}
            {children}
            {icon && iconPosition === 'right' && !loading && (
                <Icon name={icon} size={16} className="ml-2" />
            )}
        </button>
    );
};

// Floating Action Button
export const FloatingActionButton = ({ icon, onClick, className = '', ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-elevated hover:shadow-glow flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 z-50 ${className}`}
            {...props}
        >
            <Icon name={icon} size={24} />
        </button>
    );
};

// Toggle Button
export const ToggleButton = ({ pressed, onToggle, children, icon, className = '' }) => {
    return (
        <button
            onClick={onToggle}
            className={`professional-button px-4 py-2 text-sm rounded-lg transition-all duration-200 focus-ring ${pressed
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                } ${className}`}
        >
            {icon && <Icon name={icon} size={16} className="mr-2" />}
            {children}
        </button>
    );
};

// Gradient Button with Shine Effect
export const GradientButton = ({ children, gradient = 'hero', className = '', ...props }) => {
    const gradients = {
        hero: 'from-blue-600 via-purple-600 to-blue-700',
        success: 'from-emerald-600 via-green-600 to-emerald-700',
        warning: 'from-yellow-600 via-orange-600 to-yellow-700',
        danger: 'from-red-600 via-pink-600 to-red-700'
    };

    return (
        <button
            className={`relative professional-button px-6 py-3 text-base rounded-xl text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group ${className}`}
            {...props}
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${gradients[gradient]} transition-all duration-300 group-hover:scale-105`}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10">{children}</span>
        </button>
    );
};

// Icon Button
export const IconButton = ({ icon, size = 'md', variant = 'ghost', className = '', ...props }) => {
    const sizes = {
        sm: 'w-8 h-8 p-1',
        md: 'w-10 h-10 p-2',
        lg: 'w-12 h-12 p-3'
    };

    const variants = {
        ghost: 'hover:bg-white/10 text-white',
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
    };

    return (
        <button
            className={`professional-button rounded-lg transition-all duration-200 focus-ring interactive-scale ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            <Icon name={icon} size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
        </button>
    );
};

// Button Group
export const ButtonGroup = ({ children, className = '' }) => {
    return (
        <div className={`flex rounded-lg overflow-hidden border border-white/20 ${className}`}>
            {React.Children.map(children, (child, index) =>
                React.cloneElement(child, {
                    className: `${child.props.className || ''} ${index > 0 ? 'border-l border-white/20' : ''} rounded-none`
                })
            )}
        </div>
    );
};

export default {
    Button,
    FloatingActionButton,
    ToggleButton,
    GradientButton,
    IconButton,
    ButtonGroup
};
