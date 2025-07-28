import React from 'react';

const FactChecker = () => {
    return (
        <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Fact Checker</h3>
            <div className="space-y-3">
                <div className="p-3 bg-green-900/30 border border-green-600 rounded-lg">
                    <p className="text-green-400 text-sm font-medium">✓ VERIFIED</p>
                    <p className="text-white text-sm mt-1">AI regulation frameworks exist in multiple countries.</p>
                </div>
                <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium">⚠ NEEDS VERIFICATION</p>
                    <p className="text-white text-sm mt-1">Innovation rates in AI development.</p>
                </div>
                <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg">
                    <p className="text-red-400 text-sm font-medium">✗ DISPUTED</p>
                    <p className="text-white text-sm mt-1">Claims about AI safety without sources.</p>
                </div>
            </div>
        </section>
    );
};

export default FactChecker;
