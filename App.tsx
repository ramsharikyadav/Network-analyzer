import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ScanForm } from './components/ScanForm';
import { ResultsTable } from './components/ResultsTable';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { scanIp, COMMON_PORTS } from './services/networkService';
import { analyzeDeviceByPorts } from './services/geminiService';
import { Device } from './types';
import { NetworkGraph } from './components/NetworkGraph';
import { TableViewIcon } from './components/icons/TableViewIcon';
import { GraphViewIcon } from './components/icons/GraphViewIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { NetworkTools } from './components/NetworkTools';

// Helper to sort devices by IP address.
const ipToSortable = (ip: string): number => {
    // Converts "192.168.1.10" to a single number for easy sorting.
    return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0);
};

const App: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [previousScanDevices, setPreviousScanDevices] = useState<Map<string, Device>>(new Map());
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, currentIp: '', found: 0 });
    const [selectedDevice, setSelectedDevice] = useState<{ current: Device, previous?: Device } | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
    const [lastScanParams, setLastScanParams] = useState<{ ipList: string[], timeout: number } | null>(null);

    const handleStartScan = useCallback(async ({ ipList, timeout }: { ipList: string[], timeout: number }) => {
        setLastScanParams({ ipList, timeout });
        // Store current devices as the previous scan before starting a new one
        const currentDevicesMap = new Map(devices.map(d => [d.ip, d]));
        setPreviousScanDevices(currentDevicesMap);

        setIsScanning(true);
        setDevices([]);
        const total = ipList.length;
        setScanProgress({ current: 0, total, currentIp: '', found: 0 });
        setViewMode('table'); // Default to table view on new scan

        let foundDevicesCount = 0;

        // This function processes a single IP address.
        const processIp = async (ip: string) => {
            // Announce which IP we are checking now.
            setScanProgress(prev => ({ ...prev, currentIp: ip }));
            let deviceFound = false;

            try {
                const scanResult = await scanIp(ip, COMMON_PORTS, timeout);

                if (scanResult.status === 'Online') {
                    deviceFound = true;
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

                            // Check for a conflict if a device was found at this IP in the previous scan and its category has changed.
                            if (oldDevice && oldDevice.category && category && oldDevice.category !== category) {
                                const oldGroup = getCategoryGroup(oldDevice.category);
                                const newGroup = getCategoryGroup(category);
                                
                                // A "drastic" change is one where the device's fundamental role changes.
                                // This is determined by seeing if it moved between major groups (e.g., Computing -> Peripheral),
                                // or if a previously identified device is now unknown (or vice versa).
                                if (oldGroup !== newGroup) {
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
            } finally {
                 // Update progress counter once the IP check is fully complete (success or fail).
                setScanProgress(prev => ({
                    ...prev,
                    current: prev.current + 1,
                    found: prev.found + (deviceFound ? 1 : 0),
                }));
            }
        };

        // Implement a concurrency limiter to avoid overwhelming the browser with too many simultaneous connections.
        const concurrencyLimit = 20; // Process 20 IPs at a time.
        const queue = [...ipList];

        const runWorker = async () => {
            while (queue.length > 0) {
                const ipToProcess = queue.shift();
                if (ipToProcess) {
                    await processIp(ipToProcess);
                }
            }
        };
        
        const workers = Array(concurrencyLimit).fill(null).map(() => runWorker());
        await Promise.all(workers);

        // Finalize scan state
        setIsScanning(false);
        setScanProgress(prev => ({ ...prev, currentIp: 'Scan Complete' }));
        
        if (foundDevicesCount > 0) {
            // Switch to graph view after a short delay to allow final UI updates.
            setTimeout(() => setViewMode('graph'), 250);
        }
    }, [devices]);

    const handleRefreshScan = useCallback(() => {
        if (lastScanParams) {
            handleStartScan(lastScanParams);
        }
    }, [lastScanParams, handleStartScan]);

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
                        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-baseline mb-3">
                                <div className="font-mono text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">IP:</span>
                                    <span className="ml-2 truncate">
                                        {scanProgress.currentIp !== 'Scan Complete' ? scanProgress.currentIp : 'Finalizing...'}
                                    </span>
                                </div>
                                <div className="font-mono text-sm text-gray-600">
                                    {scanProgress.current} / {scanProgress.total}
                                </div>
                            </div>
    
                            <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden border border-gray-300 shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-sky-500 h-6 rounded-full transition-all duration-300 ease-out" 
                                    style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0}%` }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md">
                                    {Math.round(scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0)}%
                                </div>
                            </div>
                            
                            <div className="text-center mt-3">
                                <span className="text-3xl font-bold text-blue-600 tracking-tight">{scanProgress.found}</span>
                                <span className="text-base font-medium text-gray-700 ml-2">{scanProgress.found === 1 ? 'Device' : 'Devices'} Found</span>
                            </div>
                        </div>
                    )}

                    {!isScanning && lastScanParams && (
                         <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                            <p className="text-sm text-gray-700">
                                Scan complete. <span className="font-semibold">{devices.length}</span> {devices.length === 1 ? 'device' : 'devices'} found.
                            </p>
                            <button
                                onClick={handleRefreshScan}
                                className="flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200"
                            >
                                <RefreshIcon />
                                Refresh Scan
                            </button>
                        </div>
                    )}

                    {!isScanning && !lastScanParams && (
                         <div className="mt-6 text-center text-gray-600">
                            <p>Enter a network range and scan options to see discovered devices.</p>
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

                    <div className="mt-12 border-t border-gray-200 pt-8">
                        <NetworkTools />
                    </div>
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