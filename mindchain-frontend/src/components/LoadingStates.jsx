// Loading States Component - Professional loading indicators
import Icon from './Icon';

export const LoadingSpinner = ({ size = 16, text = "Loading..." }) => (
    <div className="flex items-center justify-center gap-2 text-blue-400">
        <Icon name="loading" size={size} className="animate-spin" />
        <span className="text-sm">{text}</span>
    </div>
);

export const LoadingSkeleton = ({ className = "", lines = 3 }) => (
    <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-full"></div>
            </div>
        ))}
    </div>
);

export const LoadingCard = ({ title = "Loading...", description = "Please wait while we fetch the data" }) => (
    <div className="bg-gradient-to-br from-slate-900/50 to-gray-900/50 backdrop-blur-sm border border-slate-600/30 rounded-xl p-6">
        <div className="flex items-center justify-center h-40 flex-col gap-4">
            <LoadingSpinner size={24} text="" />
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </div>
    </div>
);

export const LoadingOverlay = ({ isVisible, text = "Processing..." }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-8 flex items-center gap-4">
                <Icon name="loading" size={24} className="animate-spin text-blue-400" />
                <span className="text-white font-medium">{text}</span>
            </div>
        </div>
    );
};

export default {
    Spinner: LoadingSpinner,
    Skeleton: LoadingSkeleton,
    Card: LoadingCard,
    Overlay: LoadingOverlay
};
