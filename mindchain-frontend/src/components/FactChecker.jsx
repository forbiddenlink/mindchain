import React from 'react';

const FactChecker = ({ factChecks = [] }) => {
    const getFactCheckStyle = (score) => {
        if (score >= 0.8) {
            return {
                style: 'bg-green-900/30 border-green-600',
                label: '✓ HIGH CONFIDENCE',
                labelColor: 'text-green-400'
            };
        } else if (score >= 0.6) {
            return {
                style: 'bg-yellow-900/30 border-yellow-600',
                label: '⚠ MODERATE CONFIDENCE',
                labelColor: 'text-yellow-400'
            };
        } else {
            return {
                style: 'bg-red-900/30 border-red-600',
                label: '✗ LOW CONFIDENCE',
                labelColor: 'text-red-400'
            };
        }
    };

    return (
        <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Fact Checker</h3>
            
            {factChecks.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                    <p>🔍 No fact checks yet</p>
                    <p className="text-sm mt-1">Facts will appear as agents make claims</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {factChecks.map((check) => {
                        const factStyle = getFactCheckStyle(check.score);
                        return (
                            <div key={check.id} className={`p-3 border rounded-lg ${factStyle.style}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <p className={`text-sm font-medium ${factStyle.labelColor}`}>
                                        {factStyle.label}
                                    </p>
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
