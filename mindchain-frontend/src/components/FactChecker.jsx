import React from 'react';
import Icon from './Icon';

const FactChecker = ({factChecks = []}) => {
    const getFactCheckStyle = (score) => {
        if (score >= 0.8) {
            return {
                style: 'bg-green-900/30 border-green-600',
                label: 'HIGH CONFIDENCE',
                labelColor: 'text-green-400',
                icon: 'success'
            };
        } else if (score >= 0.6) {
            return {
                style: 'bg-yellow-900/30 border-yellow-600',
                label: 'MODERATE CONFIDENCE',
                labelColor: 'text-yellow-400',
                icon: 'warning'
            };
        } else {
            return {
                style: 'bg-red-900/30 border-red-600',
                label: 'LOW CONFIDENCE',
                labelColor: 'text-red-400',
                icon: 'error'
            };
        }
    };

    return (
        <section className="h-full flex flex-col bg-gradient-to-br from-neutral-900/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-600/50 overflow-hidden">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center flex-shrink-0">
                <Icon name="search" size={20} className="mr-2 text-blue-400" />
                Fact Checker
                <span className="ml-2 text-xs bg-blue-500/20 px-2 py-1 rounded-full text-blue-400">
                    {factChecks.length} checks
                </span>
            </h3>

            {factChecks.length === 0 ? (
                <div className="text-center py-6 flex-1 flex flex-col justify-center">
                    <div className="w-10 h-10 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Icon name="search" size={20} className="text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-sm">Fact-checking ready</p>
                    <p className="text-slate-500 text-xs mt-1">Awaiting agent statements</p>
                </div>
            ) : (
                <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    {factChecks.slice(-5).map((check) => {
                        const factStyle = getFactCheckStyle(check.score);
                        return (
                            <div key={check.id} className={`p-3 border rounded-lg ${factStyle.style} transition-all hover:shadow-lg`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`text-xs font-medium ${factStyle.labelColor} flex items-center gap-1`}>
                                        <Icon name={factStyle.icon} size={12} />
                                        {factStyle.label}
                                    </p>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {(check.score * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1 font-medium">CLAIM:</p>
                                        <p className="text-white text-sm leading-relaxed">
                                            {check.message}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1 font-medium">RELATED FACT:</p>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {check.fact}
                                        </p>
                                    </div>
                                </div>
                                {check.timestamp && (
                                    <div className="mt-3 pt-2 border-t border-gray-600/30">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Icon name="timer" size={12} />
                                            {new Date(check.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default FactChecker;
