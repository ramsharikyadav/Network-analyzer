import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ScanForm } from './components/ScanForm';
import { ResultsTable } from './components/ResultsTable';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { scanIp } from './services/networkService';
import { analyzeDeviceByPorts } from './services/geminiService';
import { Device } from './types';
import { NetworkGraph } from './components/NetworkGraph';
import { TableViewIcon } from './components/icons/TableViewIcon';
import { GraphViewIcon } from './components/icons/GraphViewIcon';

// Helper to sort devices by IP address.
const ipToSortable = (ip: string): number => {
    // Converts "192.168.1.10" to a single number for easy sorting.
    return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0);
};

const App: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [previousScanDevices, setPreviousScanDevices] = useState<Map<string, Device>>(new Map());
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, ip: '' });
    const [selectedDevice, setSelectedDevice] = useState<{ current: Device, previous?: Device } | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');

    const handleStartScan = useCallback(async ({ subnet, start, end, ports, timeout }: { subnet: string, start: number, end: number, ports: number[], timeout: number }) => {
        // Store current devices as the previous scan before starting a new one
        const currentDevicesMap = new Map(devices.map(d => [d.ip, d]));
        setPreviousScanDevices(currentDevicesMap);

        setIsScanning(true);
        setDevices([]);
        const total = end - start + 1;
        setScanProgress({ current: 0, total, ip: '' });
        setViewMode('table'); // Default to table view on new scan

        const ipList: string[] = [];
        for (let i = start; i <= end; i++) {
            ipList.push(`${subnet}.${i}`);
        }

        let foundDevicesCount = 0;

        // This function processes a single IP address.
        const processIp = async (ip: string) => {
            try {
                const scanResult = await scanIp(ip, ports, timeout);

                // Update progress as each IP check finishes.
                setScanProgress(prev => ({
                    current: prev.current + 1,
                    total,
                    ip: `Checked ${ip}`
                }));

                if (scanResult.status === 'Online') {
                    foundDevicesCount++;
                    const newDevice: Device = { ...scanResult, isAnalyzing: true, analysis: 'Analyzing with AI...', category: 'Analyzing...', services: [] };
                    
                    // Add new device to state, keeping the list sorted by IP to prevent UI jumping.
                    setDevices(prev => [...prev, newDevice].sort((a, b) => ipToSortable(a.ip) - ipToSortable(b.ip)));

                    // Asynchronously get AI analysis and check for conflicts. This runs in the background.
                    (async () => {
                         try {
                            const { analysis, category, services } = await analyzeDeviceByPorts(scanResult);
                            const oldDevice = currentDevicesMap.get(ip);
                            let conflict: Device['conflict'] | undefined = undefined;

                            const getCategoryGroup = (cat: string): string | null => {
                                const lowerCat = cat.toLowerCase();
                                if (['server', 'workstation', 'mobile device'].includes(lowerCat)) return 'Computing';
                                if (['router', 'nas'].includes(lowerCat)) return 'Networking';
                                if (['printer'].includes(lowerCat)) return 'Peripheral';
                                if (['iot device'].includes(lowerCat)) return 'IoT';
                                return null;
                            };

                            if (oldDevice && oldDevice.category && category) {
                                const oldGroup = getCategoryGroup(oldDevice.category);
                                const newGroup = getCategoryGroup(category);
                                
                                if (oldGroup && newGroup && oldGroup !== newGroup) {
                                    conflict = { previousCategory: oldDevice.category };
                                }
                            }
                            
                            setDevices(prev => prev.map(d => 
                                d.ip === ip ? { ...d, analysis, category, services, isAnalyzing: false, conflict } : d
                            ));
                        } catch (error) {
                             console.error(`Failed to analyze device ${ip}:`, error);
                             setDevices(prev => prev.map(d => 
                                d.ip === ip ? { ...d, analysis: 'AI analysis failed.', category: 'Error', services: [], isAnalyzing: false } : d
                            ));
                        }
                    })();
                }
            } catch (scanError) {
                console.error(`Error scanning IP ${ip}:`, scanError);
                // Still update progress even on error
                setScanProgress(prev => ({
                    current: prev.current + 1,
                    total,
                    ip: `Error checking ${ip}`
                }));
            }
        };

        // Create an array of promises, one for each IP scan. This kicks them all off.
        const scanPromises = ipList.map(ip => processIp(ip));

        // Wait for all scan promises to settle (either resolve or reject).
        await Promise.all(scanPromises);

        // Finalize scan state
        setIsScanning(false);
        setScanProgress({ current: total, total, ip: 'Scan Complete' });
        
        if (foundDevicesCount > 0) {
            // Switch to graph view after a short delay to allow final UI updates.
            setTimeout(() => setViewMode('graph'), 250);
        }
    }, [devices]);

    const handleViewDetails = (device: Device) => {
        const previous = previousScanDevices.get(device.ip);
        setSelectedDevice({ current: device, previous });
    };

    const handleCloseModal = () => {
        setSelectedDevice(null);
    };

    return (
        <div className="min-h-screen text-gray-800 font-sans">
            <Header />
            <main className="container mx-auto p-4 md:p-8">
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-lg p-6 max-w-4xl mx-auto">
                    <ScanForm onScanStart={handleStartScan} isScanning={isScanning} />
                    
                    {isScanning && (
                        <div className="mt-6 text-center">
                            <p className="text-lg text-blue-600">Scanning in progress...</p>
                            <p className="text-sm text-gray-600 font-mono">
                                {`${scanProgress.ip} (${scanProgress.current}/${scanProgress.total})`}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isScanning && devices.length === 0 && (
                         <div className="mt-6 text-center text-gray-600">
                            <p>Enter an IP range and scan options to see discovered devices.</p>
                            <p className="text-xs mt-2">Note: Scans are performed from your browser and may be slow or incomplete due to web security restrictions. Results may vary based on network conditions and browser.</p>
                        </div>
                    )}
                    
                    {devices.length > 0 && (
                        <div className="mt-8">
                           <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Discovered Devices</h2>
                                <div className="flex items-center gap-2 rounded-lg bg-gray-200 p-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                        aria-pressed={viewMode === 'table'}
                                    >
                                        <TableViewIcon /> Table
                                    </button>
                                     <button
                                        onClick={() => setViewMode('graph')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-300'}`}
                                        aria-pressed={viewMode === 'graph'}
                                    >
                                        <GraphViewIcon /> Graph
                                    </button>
                                </div>
                           </div>
                           {viewMode === 'table' ? (
                                <ResultsTable devices={devices} onViewDetails={handleViewDetails} />
                           ) : (
                                <NetworkGraph devices={devices} onViewDetails={handleViewDetails} />
                           )}
                        </div>
                    )}
                </div>
            </main>
            {selectedDevice && (
                <DeviceDetailModal 
                    device={selectedDevice.current} 
                    previousDevice={selectedDevice.previous}
                    onClose={handleCloseModal} 
                />
            )}
        </div>
    );
};

export default App;