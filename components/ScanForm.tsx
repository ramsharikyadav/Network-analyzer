import React, { useState } from 'react';
import { ScanIcon } from './icons/ScanIcon';
import { COMMON_PORTS } from '../services/networkService';

interface ScanFormProps {
    onScanStart: (params: { subnet: string, start: number, end: number, ports: number[], timeout: number }) => void;
    isScanning: boolean;
}

export const ScanForm: React.FC<ScanFormProps> = ({ onScanStart, isScanning }) => {
    const [subnet, setSubnet] = useState('192.168.1');
    const [startIp, setStartIp] = useState('1');
    const [endIp, setEndIp] = useState('254');
    const [timeout, setTimeout] = useState('800');
    const [ports, setPorts] = useState(COMMON_PORTS.join(', '));
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const start = parseInt(startIp, 10);
        const end = parseInt(endIp, 10);
        const timeoutMs = parseInt(timeout, 10);

        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(subnet)) {
            setError('Invalid subnet format. Expected format: X.X.X');
            return;
        }
        if (isNaN(start) || isNaN(end) || start < 0 || start > 255 || end < 0 || end > 255 || start > end) {
            setError('Invalid IP range. Start and end must be between 0 and 255, and start must not exceed end.');
            return;
        }
         if (isNaN(timeoutMs) || timeoutMs < 100 || timeoutMs > 5000) {
            setError('Invalid timeout. Must be a number between 100 and 5000 ms.');
            return;
        }

        const parsedPorts = ports.split(',')
            .map(p => parseInt(p.trim(), 10))
            .filter(p => !isNaN(p) && p > 0 && p <= 65535);

        if (parsedPorts.length === 0) {
            setError('Please provide at least one valid port number (1-65535) in the ports list.');
            return;
        }
        
        const uniquePorts = [...new Set(parsedPorts)];

        onScanStart({ subnet, start, end, ports: uniquePorts, timeout: timeoutMs });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="subnet" className="block text-sm font-medium text-gray-600 mb-1">Subnet</label>
                    <input
                        type="text"
                        id="subnet"
                        value={subnet}
                        onChange={(e) => setSubnet(e.target.value)}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 192.168.1"
                        disabled={isScanning}
                    />
                </div>
                <div>
                    <label htmlFor="start-ip" className="block text-sm font-medium text-gray-600 mb-1">Start IP</label>
                    <input
                        type="number"
                        id="start-ip"
                        value={startIp}
                        onChange={(e) => setStartIp(e.target.value)}
                        min="0"
                        max="255"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isScanning}
                    />
                </div>
                <div>
                    <label htmlFor="end-ip" className="block text-sm font-medium text-gray-600 mb-1">End IP</label>
                    <input
                        type="number"
                        id="end-ip"
                        value={endIp}
                        onChange={(e) => setEndIp(e.target.value)}
                        min="0"
                        max="255"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isScanning}
                    />
                </div>
                 <div>
                    <label htmlFor="timeout" className="block text-sm font-medium text-gray-600 mb-1">Timeout (ms)</label>
                    <input
                        type="number"
                        id="timeout"
                        value={timeout}
                        onChange={(e) => setTimeout(e.target.value)}
                        min="100"
                        max="5000"
                        step="100"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isScanning}
                    />
                </div>
            </div>

            <div className="mt-4">
                <label htmlFor="ports" className="block text-sm font-medium text-gray-600 mb-1">Ports to Scan (comma-separated)</label>
                <textarea
                    id="ports"
                    value={ports}
                    onChange={(e) => setPorts(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={3}
                    placeholder="e.g., 80, 443, 8080"
                    disabled={isScanning}
                />
            </div>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            <div className="mt-4">
                <button
                    type="submit"
                    disabled={isScanning}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200"
                >
                    <ScanIcon />
                    {isScanning ? 'Scanning...' : 'Start Scan'}
                </button>
            </div>
        </form>
    );
};