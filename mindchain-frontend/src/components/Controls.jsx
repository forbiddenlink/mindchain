import React, { useState } from 'react';
import api from '../services/api';

const Controls = () => {
    const [topic, setTopic] = useState('climate change policy');
    const [isDebating, setIsDebating] = useState(false);
    const [loading, setLoading] = useState({
        start: false,
        stop: false,
        addFact: false,
        summarize: false
    });

    const handleStartDebate = async () => {
        console.log('🎯 Start Debate clicked!');
        setLoading(prev => ({ ...prev, start: true }));
        try {
            console.log('🚀 Calling API to start debate...');
            const result = await api.startDebate({
                debateId: `debate_${Date.now()}`,
                topic,
                agents: ['senatorbot', 'reformerbot']
            });
            console.log('✅ Debate started successfully:', result);
            setIsDebating(true);
        } catch (error) {
            console.error('❌ Failed to start debate:', error);
            alert('Failed to start debate. Check console for details.');
        } finally {
            setLoading(prev => ({ ...prev, start: false }));
        }
    };

    const handleStopDebate = () => {
        setIsDebating(false);
        // Note: In a real implementation, we'd send a stop signal to the backend
    };

    const handleAddFact = async () => {
        setLoading(prev => ({ ...prev, addFact: true }));
        try {
            const fact = prompt('Enter a new fact to add to the knowledge base:');
            if (fact) {
                // In a real implementation, we'd have an API endpoint to add facts
                alert('Fact would be added to the knowledge base');
            }
        } catch (error) {
            console.error('Failed to add fact:', error);
        } finally {
            setLoading(prev => ({ ...prev, addFact: false }));
        }
    };

    const handleSummarize = async () => {
        setLoading(prev => ({ ...prev, summarize: true }));
        try {
            // In a real implementation, we'd call a summarization endpoint
            alert('Debate summary would be generated');
        } catch (error) {
            console.error('Failed to generate summary:', error);
        } finally {
            setLoading(prev => ({ ...prev, summarize: false }));
        }
    };

    return (
        <section className="bg-neutral-900 rounded-lg p-6 border border-neutral-700">
            <h3 className="text-xl font-semibold mb-4 text-white">Debate Controls</h3>
            <div className="space-y-4">
                <div className="flex gap-3">
                    <button 
                        onClick={handleStartDebate}
                        disabled={isDebating || loading.start}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading.start ? 'Starting...' : 'Start Debate'}
                    </button>
                    <button 
                        onClick={handleStopDebate}
                        disabled={!isDebating}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Stop Debate
                    </button>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleAddFact}
                        disabled={loading.addFact}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading.addFact ? 'Adding...' : 'Add Fact'}
                    </button>
                    <button 
                        onClick={handleSummarize}
                        disabled={loading.summarize}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        {loading.summarize ? 'Generating...' : 'Summarize'}
                    </button>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Debate Topic
                    </label>
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isDebating}
                        placeholder="Enter a topic for debate..."
                        className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-700">
                    <span className="text-sm text-gray-400">Status:</span>
                    <span className={`text-sm font-medium ${isDebating ? 'text-green-400' : 'text-gray-400'}`}>
                        {isDebating ? '🟢 Live Debate' : '⚪ Idle'}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default Controls;
