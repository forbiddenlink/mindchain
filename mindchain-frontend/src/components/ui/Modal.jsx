// Enhanced Modal System - Enterprise Grade Dialog Components
import React, { useEffect, useRef } from 'react';
import Icon from '../Icon';

// Base Modal Component
export const Modal = ({
    isOpen,
    onClose,
    children,
    size = 'md',
    className = '',
    closeOnOverlay = true,
    closeOnEscape = true
}) => {
    const modalRef = useRef(null);

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-7xl'
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, closeOnEscape]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeOnOverlay ? onClose : undefined}
        >
            <div
                ref={modalRef}
                className={`glass-panel rounded-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

// Modal Header
export const ModalHeader = ({
    title,
    subtitle,
    onClose,
    icon,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between p-6 border-b border-slate-700/50 ${className}`}>
            <div className="flex items-center space-x-4">
                {icon && (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Icon name={icon} size={24} className="text-blue-400" />
                    </div>
                )}
                <div>
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    {subtitle && (
                        <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors group"
                >
                    <Icon name="x" size={20} className="text-slate-400 group-hover:text-white" />
                </button>
            )}
        </div>
    );
};

// Modal Content
export const ModalContent = ({ children, className = '' }) => {
    return (
        <div className={`p-6 overflow-y-auto ${className}`}>
            {children}
        </div>
    );
};

// Modal Footer
export const ModalFooter = ({ children, className = '' }) => {
    return (
        <div className={`flex items-center justify-end space-x-3 p-6 border-t border-slate-700/50 ${className}`}>
            {children}
        </div>
    );
};

// Confirmation Dialog
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    icon = 'alert-triangle'
}) => {
    const variants = {
        primary: 'btn-primary',
        danger: 'btn-danger',
        warning: 'btn-warning',
        success: 'btn-success'
    };

    const iconColors = {
        primary: 'text-blue-400',
        danger: 'text-red-400',
        warning: 'text-yellow-400',
        success: 'text-green-400'
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader
                title={title}
                icon={icon}
                onClose={onClose}
            />
            <ModalContent>
                <p className="text-slate-300 leading-relaxed">{message}</p>
            </ModalContent>
            <ModalFooter>
                <button onClick={onClose} className="btn-ghost">
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={variants[variant]}
                >
                    {confirmText}
                </button>
            </ModalFooter>
        </Modal>
    );
};

// Info Dialog
export const InfoDialog = ({
    isOpen,
    onClose,
    title,
    message,
    details,
    icon = 'info',
    actions
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalHeader
                title={title}
                icon={icon}
                onClose={onClose}
            />
            <ModalContent>
                <div className="space-y-4">
                    <p className="text-slate-300 leading-relaxed">{message}</p>
                    {details && (
                        <div className="glass-card p-4 rounded-xl bg-slate-800/50">
                            <pre className="text-sm text-slate-400 whitespace-pre-wrap font-mono overflow-x-auto">
                                {details}
                            </pre>
                        </div>
                    )}
                </div>
            </ModalContent>
            <ModalFooter>
                {actions || (
                    <button onClick={onClose} className="btn-primary">
                        OK
                    </button>
                )}
            </ModalFooter>
        </Modal>
    );
};

// Input Dialog
export const InputDialog = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    label,
    placeholder,
    defaultValue = '',
    type = 'text',
    required = false,
    icon = 'edit-3'
}) => {
    const [value, setValue] = React.useState(defaultValue);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (required && !value.trim()) return;
        onSubmit(value);
        onClose();
        setValue(defaultValue);
    };

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader
                title={title}
                icon={icon}
                onClose={onClose}
            />
            <form onSubmit={handleSubmit}>
                <ModalContent>
                    <div className="space-y-4">
                        {label && (
                            <label className="block text-sm font-medium text-slate-300">
                                {label}
                                {required && <span className="text-red-400 ml-1">*</span>}
                            </label>
                        )}
                        <input
                            type={type}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                            autoFocus
                            required={required}
                        />
                    </div>
                </ModalContent>
                <ModalFooter>
                    <button type="button" onClick={onClose} className="btn-ghost">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        Submit
                    </button>
                </ModalFooter>
            </form>
        </Modal>
    );
};

export default {
    Modal,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ConfirmDialog,
    InfoDialog,
    InputDialog
};
