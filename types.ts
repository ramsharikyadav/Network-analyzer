export interface PortService {
    port: number;
    serviceName: string;
    description: string;
}

export interface StabilityResult {
    successRate: number;
    totalPings: number;
    avgLatency: number;
    jitter: number;
    error?: string;
}


export interface Device {
    ip: string;
    status: 'Online' | 'Offline';
    openPorts: number[];
    analysis: string;
    isAnalyzing: boolean;
    category: string;
    services?: PortService[];
    conflict?: {
        previousCategory: string;
    };
}