import React from 'react';

const Header = () => {
    return (
        <header className="w-full bg-gradient-to-r from-[#1a1a1a] to-[#2b2b2b] text-white py-4 shadow-md border-b border-neutral-700">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        MC
                    </div>
                    <h1 className="text-2xl font-semibold tracking-wide">
                        MindChain Debate Engine
                    </h1>
                </div>
                <div className="text-sm text-neutral-400">Redis AI Challenge · 2025</div>
            </div>
        </header>
    );
};

export default Header;
