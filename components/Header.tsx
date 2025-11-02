import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="container mx-auto px-4 md:px-8 py-4">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
                    LAN Network Analyzer
                </h1>
                <p className="text-gray-600 text-sm">Discover and analyze devices on your local network.</p>
            </div>
        </header>
    );
};