import React from 'react';

const Controls = () => {
    return (
        <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Debate Controls</h3>
            <div className="space-y-4">
                <div className="flex gap-3">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Start Debate
                    </button>
                    <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Stop Debate
                    </button>
                </div>
                <div className="flex gap-3">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Add Fact
                    </button>
                    <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Summarize
                    </button>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Debate Topic
                    </label>
                    <input 
                        type="text" 
                        placeholder="Enter a topic for debate..."
                        className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </section>
    );
};

export default Controls;
