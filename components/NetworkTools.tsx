import React from 'react';

interface Tool {
    name: string;
    description: string;
    category: string;
    url: string;
}

const tools: Tool[] = [
    {
        name: 'Wireshark',
        description: "The world's foremost and widely-used network protocol analyzer.",
        category: 'Packet Analysis',
        url: 'https://www.wireshark.org/',
    },
    {
        name: 'Nmap',
        description: 'A powerful, free utility for network discovery and security auditing.',
        category: 'Security Scanning',
        url: 'https://nmap.org/',
    },
    {
        name: 'GNS3',
        description: 'A graphical network simulator to design complex network topologies.',
        category: 'Network Simulation',
        url: 'https://www.gns3.com/',
    },
    {
        name: 'Cisco Packet Tracer',
        description: 'A cross-platform visual simulation tool designed by Cisco Systems.',
        category: 'Learning & Simulation',
        url: 'https://www.netacad.com/courses/packet-tracer',
    },
    {
        name: 'iPerf',
        description: 'A tool for active measurements of the maximum achievable bandwidth on IP networks.',
        category: 'Performance Testing',
        url: 'https://iperf.fr/',
    },
    {
        name: 'Ping & Traceroute',
        description: 'Fundamental command-line utilities for testing reachability and tracing packet routes.',
        category: 'Basic Diagnostics',
        url: 'https://en.wikipedia.org/wiki/Ping_(networking_utility)',
    },
];

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Packet Analysis': return 'bg-blue-100 text-blue-800';
        case 'Security Scanning': return 'bg-red-100 text-red-800';
        case 'Network Simulation': return 'bg-green-100 text-green-800';
        case 'Learning & Simulation': return 'bg-indigo-100 text-indigo-800';
        case 'Performance Testing': return 'bg-amber-100 text-amber-800';
        case 'Basic Diagnostics': return 'bg-gray-100 text-gray-800';
        default: return 'bg-slate-100 text-slate-800';
    }
};

export const NetworkTools: React.FC = () => {
    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Advanced Network Tools</h2>
            <p className="text-sm text-gray-600 mb-4">
                While this browser-based tool is great for quick discovery, professionals use dedicated software for in-depth analysis. Here are some of the best:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                    <div key={tool.name} className="bg-white/60 p-4 rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex flex-col">
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800">{tool.name}</h3>
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getCategoryColor(tool.category)}`}>
                                    {tool.category}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{tool.description}</p>
                        </div>
                        <div className="mt-4">
                            <a 
                                href={tool.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Learn More &rarr;
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};