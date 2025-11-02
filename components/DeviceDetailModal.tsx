import React, { useState } from 'react';
import { Device, StabilityResult } from '../types';
import { XIcon } from './icons/XIcon';
import { PulseIcon } from './icons/PulseIcon';
import { checkStability } from '../services/networkService';
import { Spinner } from './Spinner';
import { WarningIcon } from './icons/WarningIcon';

interface DeviceDetailModalProps {
    device: Device;
    previousDevice?: Device;
    onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ device, onClose }) => {
    const [isCheckingStability, setIsCheckingStability] = useState(false);
    const [stabilityResult, setStabilityResult] = useState<StabilityResult | null>(null);

    const handleRunStabilityCheck = async () => {
        const portToTest = device.openPorts.length > 0 ? device.openPorts[0] : undefined;

        if (!portToTest) {
            setStabilityResult({ 
                successRate: 0, 
                totalPings: 0, 
                avgLatency: 0, 
                jitter: 0, 
                error: "No open ports available to run a stability test."
            });
            return;
        }

        setIsCheckingStability(true);
        setStabilityResult(null);
        const result = await checkStability(device.ip, portToTest);
        setStabilityResult(result);
        setIsCheckingStability(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Device Details</h3>
                        <p className="font-mono text-sky-600">{device.ip}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* IP Conflict Warning Banner */}
                    {device.conflict && (
                        <div className="p-4 mb-2 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-lg" role="alert">
                            <div className="flex items-center gap-3">
                                <WarningIcon className="h-6 w-6" />
                                <h4 className="font-bold text-lg">Potential IP Address Conflict Detected</h4>
                            </div>
                            <div className="mt-3 text-sm space-y-2">
                               <p>The device identified at this IP address has changed since the last scan, which may indicate an IP conflict or a DHCP issue.</p>
                               <ul className="list-disc pl-5">
                                   <li>Previously Detected: <strong className="font-semibold">{device.conflict.previousCategory}</strong></li>
                                   <li>Currently Detected: <strong className="font-semibold">{device.category}</strong></li>
                               </ul>
                               <p className="pt-2">
                                   <strong className="font-semibold">How to Resolve:</strong> If both devices are expected to be online, one may have a misconfigured static IP. Try turning one device off or check your router's DHCP settings to ensure IPs are not duplicated.
                               </p>
                            </div>
                        </div>
                    )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-gray-700">Status</h4>
                            <p>
                                {device.conflict ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                        Potential Conflict
                                    </span>
                                ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Online
                                    </span>
                                )}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700">AI-Identified Category</h4>
                            <p>
                                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${device.category === 'Error' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {device.isAnalyzing ? 'Analyzing...' : device.category}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">Open Ports</h4>
                        {device.openPorts.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {device.openPorts.map(port => (
                                    <span key={port} className="bg-gray-200 text-gray-700 text-xs font-mono px-2.5 py-1 rounded-full">{port}</span>
                                ))}
                            </div>
                        ) : (
                             <p className="text-gray-500">No common open ports found.</p>
                        )}
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-700">Identified Services</h4>
                        {device.services && device.services.length > 0 ? (
                            <ul className="mt-2 space-y-3">
                                {device.services.map(service => (
                                    <li key={service.port} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-bold text-gray-800">{service.serviceName}</p>
                                            <span className="font-mono bg-gray-200 text-sky-600 text-xs px-2 py-0.5 rounded">{service.port}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-gray-500 mt-1 italic">
                                {device.isAnalyzing ? 'Analyzing...' : 'No specific services identified by AI.'}
                             </p>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">AI-Powered Analysis Summary</h4>
                        <div className="mt-1 p-4 bg-gray-50 rounded-md border border-gray-200 text-gray-700 whitespace-pre-wrap">
                            {device.isAnalyzing ? <span className="text-gray-500">Still analyzing...</span> : device.analysis}
                        </div>
                    </div>

                    {/* New Diagnostics Section */}
                    <div className="border-t border-gray-200 pt-6">
                         <h3 className="text-lg font-bold text-gray-900 mb-4">Diagnostics</h3>
                         <div className="space-y-6">
                            {/* Network Stability */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-700 mb-2">Network Stability Test</h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    {device.openPorts.length > 0 
                                        ? `This test will ping the device's first open port (${device.openPorts[0]}) to measure connection latency and stability.`
                                        : 'No open ports are available to run a stability test.'
                                    }
                                </p>
                                
                                <button 
                                    onClick={handleRunStabilityCheck} 
                                    disabled={isCheckingStability || device.openPorts.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200 text-sm"
                                >
                                    <PulseIcon />
                                    {isCheckingStability ? 'Testing...' : 'Run Test'}
                                </button>
                                
                                <div className="mt-4 min-h-[4.5rem] flex items-center justify-center p-2 bg-white rounded-md border border-gray-200">
                                    {isCheckingStability ? (
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Spinner />
                                            <span>Pinging device...</span>
                                        </div>
                                    ) : stabilityResult ? (
                                        <div>
                                            {stabilityResult.error ? (
                                                <p className="text-red-600">{stabilityResult.error}</p>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-4 text-center w-full">
                                                    <div>
                                                        <div className="text-2xl font-bold text-green-600">{stabilityResult.successRate}/{stabilityResult.totalPings}</div>
                                                        <div className="text-xs text-gray-500 uppercase">Success</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-sky-600">{stabilityResult.avgLatency.toFixed(0)}<span className="text-base">ms</span></div>
                                                        <div className="text-xs text-gray-500 uppercase">Avg Latency</div>
                                                    </div>
                                                        <div>
                                                        <div className="text-2xl font-bold text-amber-600">{stabilityResult.jitter.toFixed(0)}<span className="text-base">ms</span></div>
                                                        <div className="text-xs text-gray-500 uppercase">Jitter</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                         <p className="text-sm text-gray-500">Run the test to see stability results.</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* IP Conflict Info */}
                             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-700 mb-2">IP Conflict Information</h4>
                                <p className="text-sm text-gray-600">
                                    An IP conflict occurs when two devices on the same network have the same IP address. This can cause intermittent connectivity for both.
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    <strong className="text-gray-800">How to Check:</strong> Manually verify that the device identified by our AI (e.g., a "{device.category}") matches the physical device you expect at <code className="bg-gray-200 text-sky-600 text-xs px-1.5 py-0.5 rounded">{device.ip}</code>. If they don't match, you may need to check the network settings on the unexpected device.
                                </p>
                            </div>
                         </div>
                    </div>
                </div>
                <div className="bg-gray-100 px-6 py-3 text-right rounded-b-lg">
                    <button 
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};