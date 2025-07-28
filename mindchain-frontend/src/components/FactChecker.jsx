import React from 'react';

const FactChecker = ({ factChecks = [] }) => {
    const getFactCheckStyle = (score) => {
        if (score >= 0.8) {
            return {
                style: 'bg-green-900/30 border-green-600',
                label: (
                    <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>HIGH CONFIDENCE</span>
                    </div>
                ),
                labelColor: 'text-green-400'
            };
        } else if (score >= 0.6) {
            return {
                style: 'bg-yellow-900/30 border-yellow-600',
                label: (
                    <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>MODERATE CONFIDENCE</span>
                    </div>
                ),
                labelColor: 'text-yellow-400'
            };
        } else {
            return {
                style: 'bg-red-900/30 border-red-600',
                label: (
                    <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>LOW CONFIDENCE</span>
                    </div>
                ),
                labelColor: 'text-red-400'
            };
        }
    };

    return (
        <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Fact Checker</h3>

            {factChecks.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                    <div className="flex flex-col items-center space-y-2">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <p>No fact checks yet</p>
                        <p className="text-sm mt-1">Facts will appear as agents make claims</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {factChecks.map((check) => {
                        const factStyle = getFactCheckStyle(check.score);
                        return (
                            <div key={check.id} className={`p-3 border rounded-lg ${factStyle.style}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`text-sm font-medium ${factStyle.labelColor}`}>
                                        {factStyle.label}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        Score: {(check.score * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <p className="text-white text-sm mb-2">
                                    <strong>Claim:</strong> {check.message.slice(0, 100)}...
                                </p>
                                <p className="text-gray-300 text-sm">
                                    <strong>Related Fact:</strong> {check.fact}
                                </p>
                                {check.timestamp && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(check.timestamp).toLocaleTimeString()}
                                    </p>
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
