import React, { useState } from 'react';
import { ScanIcon } from './icons/ScanIcon';
import { getLocalIpAddress } from '../services/networkService';
import { DetectIpIcon } from './icons/DetectIpIcon';
import { parseCidr } from '../utils/cidrUtils';
import { LocalIpDisplay } from './LocalIpDisplay';


interface ScanFormProps {
    onScanStart: (params: { ipList: string[], timeout: number }) => void;
    isScanning: boolean;
}

const PRESETS = [
    { name: '192.168.1.0/24', cidr: '192.168.1.0/24' },
    { name: '192.168.0.0/24', cidr: '192.168.0.0/24' },
    { name: '10.0.0.0/24', cidr: '10.0.0.0/24' },
];

export const ScanForm: React.FC<ScanFormProps> = ({ onScanStart, isScanning }) => {
    const [cidr, setCidr] = useState('192.168.1.0/24');
    const [timeout, setTimeout] = useState('800');
    const [error, setError] = useState('');
    const [isDetectingIp, setIsDetectingIp] = useState(false);
    // New state to hold the IP detection result
    const [detectedIpInfo, setDetectedIpInfo] = useState<{ ip: string | null, error: string | null }>({ ip: null, error: null });
    const [detectionAttempted, setDetectionAttempted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const { ipList, error: parseError } = parseCidr(cidr);
        if (parseError) {
            setError(parseError);
            return;
        }

        const timeoutMs = parseInt(timeout, 10);
        if (isNaN(timeoutMs) || timeoutMs < 100 || timeoutMs > 5000) {
            setError('Invalid timeout. Must be a number between 100 and 5000 ms.');
            return;
        }

        onScanStart({ ipList, timeout: timeoutMs });
    };

    const handlePresetClick = (preset: typeof PRESETS[0]) => {
        setCidr(preset.cidr);
        setError('');
    };

    const handleDetectIp = async () => {
        setIsDetectingIp(true);
        setDetectionAttempted(true); // Mark that we've tried to detect
        setDetectedIpInfo({ ip: null, error: null }); // Reset previous state
        setError('');

        try {
            const ip = await getLocalIpAddress();
            if (ip) {
                const networkAddress = ip.substring(0, ip.lastIndexOf('.')) + '.0';
                setCidr(`${networkAddress}/24`);
                setDetectedIpInfo({ ip, error: null }); // Set success state
            } else {
                const errorMessage = 'Could not detect local IP. Your browser might not support this feature or it may be blocked by a security setting.';
                setDetectedIpInfo({ ip: null, error: errorMessage }); // Set error state
            }
        } catch (err) {
            console.error('IP detection failed:', err);
            const errorMessage = 'An error occurred while trying to detect your IP address.';
            setDetectedIpInfo({ ip: null, error: errorMessage }); // Set error state
        }
        setIsDetectingIp(false);
    };

    return (
        <form onSubmit={handleSubmit}>
             <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Scan Common Networks</label>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                        <button
                            type="button"
                            key={preset.name}
                            onClick={() => handlePresetClick(preset)}
                            disabled={isScanning || isDetectingIp}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all border font-mono ${cidr === preset.cidr ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {preset.name}
                        </button>
                    ))}
                     <button
                        type="button"
                        onClick={handleDetectIp}
                        disabled={isScanning || isDetectingIp}
                        className="px-4 py-2 text-sm font-semibold rounded-md transition-all border flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DetectIpIcon />
                        {isDetectingIp ? 'Detecting...' : 'Use My Network'}
                    </button>
                </div>
                 <p className="text-xs text-gray-500 mt-2">Click a preset or detect your network to populate the range below.</p>
                 
                 {/* Conditionally render the new component */}
                 {detectionAttempted && (
                    <LocalIpDisplay 
                        isLoading={isDetectingIp}
                        ipAddress={detectedIpInfo.ip}
                        error={detectedIpInfo.error}
                    />
                 )}
            </div>

            <p className="text-sm font-medium text-gray-700 mb-2">Scan Configuration</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="cidr" className="block text-xs font-medium text-gray-600 mb-1">Network Range (CIDR)</label>
                    <input
                        type="text"
                        id="cidr"
                        value={cidr}
                        onChange={(e) => setCidr(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="e.g., 192.168.1.0/24"
                        disabled={isScanning}
                    />
                </div>
                 <div>
                    <label htmlFor="timeout" className="block text-xs font-medium text-gray-600 mb-1">Timeout (ms)</label>
                    <input
                        type="number"
                        id="timeout"
                        value={timeout}
                        onChange={(e) => setTimeout(e.target.value)}
                        min="100"
                        max="5000"
                        step="100"
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isScanning}
                    />
                </div>
            </div>

            <div className="mt-4">
                <p className="text-xs text-gray-500 text-center">
                    The scan will check for a list of common ports (e.g., HTTP, SSH, SMB) on each device.
                </p>
            </div>

            {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            <div className="mt-4">
                <button
                    type="submit"
                    disabled={isScanning || isDetectingIp}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200"
                >
                    <ScanIcon />
                    {isScanning ? 'Scanning...' : 'Start Scan'}
                </button>
            </div>
        </form>
    );
};