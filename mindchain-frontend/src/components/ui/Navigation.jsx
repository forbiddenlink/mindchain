// Enhanced Navigation Component - Professional Page Navigation
import React from 'react';
import Icon from '../Icon';

// Tab Navigation
export const TabNavigation = ({ 
    tabs, 
    activeTab, 
    onTabChange, 
    variant = 'default',
    className = '' 
}) => {
    const variants = {
        default: 'bg-slate-800/50 border border-slate-700/50',
        glass: 'glass-panel',
        minimal: 'border-b border-slate-700/50'
    };
    
    return (
        <div className={`${variants[variant]} ${variant === 'minimal' ? '' : 'rounded-xl p-1'} ${className}`}>
            <nav className="flex space-x-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                            ${activeTab === tab.id 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }
                            ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        disabled={tab.disabled}
                    >
                        {tab.icon && (
                            <Icon 
                                name={tab.icon} 
                                size={18} 
                                className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} 
                            />
                        )}
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};

// Breadcrumb Navigation
export const Breadcrumb = ({ items, separator = 'chevron-right', className = '' }) => {
    return (
        <nav className={`flex items-center space-x-2 text-sm ${className}`}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <Icon name={separator} size={14} className="text-slate-500" />
                    )}
                    {item.href ? (
                        <a 
                            href={item.href}
                            className="text-slate-400 hover:text-white transition-colors"
                            onClick={item.onClick}
                        >
                            {item.label}
                        </a>
                    ) : (
                        <span className={index === items.length - 1 ? 'text-white font-medium' : 'text-slate-400'}>
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

// Sidebar Navigation
export const SidebarNav = ({ 
    items, 
    activeItem, 
    onItemClick,
    collapsed = false,
    className = '' 
}) => {
    return (
        <nav className={`space-y-1 ${className}`}>
            {items.map((item) => (
                <div key={item.id}>
                    <button
                        onClick={() => onItemClick?.(item.id)}
                        className={`
                            w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                            ${activeItem === item.id 
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }
                            ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        disabled={item.disabled}
                        title={collapsed ? item.label : undefined}
                    >
                        {item.icon && (
                            <Icon 
                                name={item.icon} 
                                size={20} 
                                className={activeItem === item.id ? 'text-blue-400' : 'text-slate-400'} 
                            />
                        )}
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.badge && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                        {item.badge}
                                    </span>
                                )}
                                {item.hasSubmenu && (
                                    <Icon name="chevron-down" size={16} className="text-slate-400" />
                                )}
                            </>
                        )}
                    </button>
                    
                    {/* Submenu items */}
                    {item.submenu && !collapsed && activeItem === item.id && (
                        <div className="ml-6 mt-2 space-y-1">
                            {item.submenu.map((subItem) => (
                                <button
                                    key={subItem.id}
                                    onClick={() => onItemClick?.(subItem.id)}
                                    className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                                >
                                    {subItem.icon && (
                                        <Icon name={subItem.icon} size={16} className="text-slate-500" />
                                    )}
                                    <span>{subItem.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
};

// Pagination Component
export const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    showFirstLast = true,
    showPrevNext = true,
    maxVisible = 5,
    className = '' 
}) => {
    const getVisiblePages = () => {
        const pages = [];
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return pages;
    };
    
    const PageButton = ({ page, active = false, disabled = false, children, onClick }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-10 h-10 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                ${active 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : disabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }
            `}
        >
            {children || page}
        </button>
    );
    
    return (
        <div className={`flex items-center space-x-1 ${className}`}>
            {showFirstLast && currentPage > 1 && (
                <PageButton 
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    <Icon name="chevrons-left" size={16} />
                </PageButton>
            )}
            
            {showPrevNext && (
                <PageButton 
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <Icon name="chevron-left" size={16} />
                </PageButton>
            )}
            
            {getVisiblePages().map(page => (
                <PageButton
                    key={page}
                    page={page}
                    active={page === currentPage}
                    onClick={() => onPageChange(page)}
                />
            ))}
            
            {showPrevNext && (
                <PageButton 
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <Icon name="chevron-right" size={16} />
                </PageButton>
            )}
            
            {showFirstLast && currentPage < totalPages && (
                <PageButton 
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    <Icon name="chevrons-right" size={16} />
                </PageButton>
            )}
        </div>
    );
};

// Step Navigation (Wizard)
export const StepNavigation = ({ 
    steps, 
    currentStep, 
    onStepClick,
    allowClickBack = true,
    className = '' 
}) => {
    return (
        <div className={`flex items-center justify-between ${className}`}>
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                const isClickable = allowClickBack && (isCompleted || isActive);
                
                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                            <button
                                onClick={isClickable ? () => onStepClick(stepNumber) : undefined}
                                disabled={!isClickable}
                                className={`
                                    w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-200
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110' 
                                        : isCompleted
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-700 text-slate-400'
                                    }
                                    ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                                `}
                            >
                                {isCompleted ? (
                                    <Icon name="check" size={20} />
                                ) : (
                                    stepNumber
                                )}
                            </button>
                            <span className={`mt-2 text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        
                        {index < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-slate-700'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default {
    TabNavigation,
    Breadcrumb,
    SidebarNav,
    Pagination,
    StepNavigation
};
