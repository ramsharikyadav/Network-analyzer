import { Device, StabilityResult } from '../types';

// A selection of common ports to check for services.
// Expanded to be more comprehensive.
export const COMMON_PORTS = [
    21,   // FTP
    22,   // SSH
    23,   // Telnet
    25,   // SMTP
    53,   // DNS
    80,   // HTTP
    110,  // POP3
    143,  // IMAP
    443,  // HTTPS
    445,  // SMB
    993,  // IMAPS
    995,  // POP3S
    1433, // MSSQL
    1521, // Oracle
    3306, // MySQL/MariaDB
    3389, // RDP
    5432, // PostgreSQL
    5900, // VNC
    6379, // Redis
    8000, // HTTP Alt
    8080, // HTTP Alt
    8443, // HTTPS Alt
];

/**
 * Attempts to check if a specific port is open on a host using a WebSocket connection.
 * This is a browser-limited way of port scanning. It's not perfectly reliable but
 * can detect services that respond to WebSocket handshake attempts.
 * @param host The IP address to scan.
 * @param port The port number to check.
 * @param timeout The connection timeout in milliseconds.
 * @returns A promise that resolves to an object with the port and its status ('open' or 'closed').
 */
const checkPort = (host: string, port: number, timeout = 800): Promise<{ port: number, status: 'open' | 'closed' }> => {
    return new Promise((resolve) => {
        const socket = new WebSocket(`ws://${host}:${port}`);
        let resolved = false;

        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                socket.close();
                resolve({ port, status: 'closed' });
            }
        }, timeout);

        socket.onopen = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                socket.close();
                resolve({ port, status: 'open' });
            }
        };

        socket.onerror = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                resolve({ port, status: 'closed' });
            }
        };
    });
};


/**
 * A "ping" function that measures connection time to a port.
 * @param host The IP address to ping.
 * @param port The port number to connect to.
 * @param timeout The connection timeout in milliseconds.
 * @returns A promise that resolves with the connection status and duration.
 */
const pingPort = (host: string, port: number, timeout = 500): Promise<{ status: 'open' | 'closed', duration: number }> => {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const socket = new WebSocket(`ws://${host}:${port}`);
        let resolved = false;

        const timer = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                socket.close();
                resolve({ status: 'closed', duration: performance.now() - startTime });
            }
        }, timeout);

        socket.onopen = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                socket.close();
                resolve({ status: 'open', duration: performance.now() - startTime });
            }
        };

        socket.onerror = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timer);
                resolve({ status: 'closed', duration: performance.now() - startTime });
            }
        };
    });
};

/**
 * Checks the network stability of a device by pinging a port multiple times.
 * @param ip The IP address of the device.
 * @param port An open port on the device to test against.
 * @param pings The number of pings to send.
 * @param timeout Timeout for each ping in ms.
 * @returns A promise that resolves to a StabilityResult object.
 */
export const checkStability = async (ip: string, port: number, pings: number = 20, timeout: number = 500): Promise<StabilityResult> => {
    const pingPromises = [];
    for (let i = 0; i < pings; i++) {
        pingPromises.push(pingPort(ip, port, timeout));
    }

    const results = await Promise.all(pingPromises);
    const successfulPings = results.filter(r => r.status === 'open');
    const latencies = successfulPings.map(p => p.duration);

    if (latencies.length === 0) {
        return { successRate: 0, totalPings: pings, avgLatency: 0, jitter: 0 };
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    
    // Calculate jitter (standard deviation of latency)
    const variance = latencies.map(l => Math.pow(l - avgLatency, 2)).reduce((a, b) => a + b, 0) / latencies.length;
    const jitter = Math.sqrt(variance);

    return {
        successRate: successfulPings.length,
        totalPings: pings,
        avgLatency,
        jitter,
    };
};

/**
 * Scans a single IP address for a list of open ports using an efficient two-stage process.
 * @param ip The IP address to scan.
 * @param ports The list of ports to check.
 * @param timeout The timeout in ms for each port check.
 * @returns A promise that resolves to a Device object with scan results.
 */
export const scanIp = async (ip: string, ports: number[], timeout: number): Promise<Pick<Device, 'ip' | 'status' | 'openPorts'>> => {
    // Optimization: Implement a two-stage scan. First, check a few common ports to quickly
    // determine if a host is likely online. This avoids running a full, time-consuming
    // port scan on every IP address in the range, many of which will be offline.

    // Stage 1: Discovery Scan
    // A small set of the most common ports to quickly find active hosts (web, remote access, file sharing).
    const discoveryPorts = [80, 443, 22, 445, 8080, 3389, 5900];
    const discoveryChecks = discoveryPorts.map(port => checkPort(ip, port, timeout));
    
    const discoveryResults = await Promise.all(discoveryChecks);
    const openDiscoveryPorts = discoveryResults
        .filter(result => result.status === 'open')
        .map(result => result.port);

    // If no ports in the discovery set are open, we assume the host is offline and bail early.
    if (openDiscoveryPorts.length === 0) {
        return { ip, status: 'Offline', openPorts: [] };
    }

    // Stage 2: Full Scan
    // The host is online. Now, check the rest of the ports from the main list.
    const remainingPorts = ports.filter(p => !discoveryPorts.includes(p));
    const fullScanChecks = remainingPorts.map(port => checkPort(ip, port, timeout));
    const fullScanResults = await Promise.all(fullScanChecks);
    
    const openFullScanPorts = fullScanResults
        .filter(result => result.status === 'open')
        .map(result => result.port);
    
    // Combine results from both stages and sort them for consistent UI display.
    const allOpenPorts = [...openDiscoveryPorts, ...openFullScanPorts];
    allOpenPorts.sort((a, b) => a - b);
    
    return {
        ip,
        status: 'Online',
        openPorts: allOpenPorts,
    };
};

/**
 * Attempts to find the user's local IP address using WebRTC.
 * This is the most common method to get local IP in a browser, but it's not guaranteed to work.
 * @returns A promise that resolves to the local IP address string or null if not found.
 */
export const getLocalIpAddress = (): Promise<string | null> => {
    return new Promise((resolve) => {
        // @ts-ignore
        const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTCPeerConnection) {
            return resolve(null);
        }

        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch(() => resolve(null));

        const ipRegex = /(192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})/;
        let ipFound = false;

        pc.onicecandidate = (ice) => {
            if (ipFound || !ice || !ice.candidate || !ice.candidate.candidate) {
                return;
            }
            const match = ipRegex.exec(ice.candidate.candidate);
            if (match) {
                ipFound = true;
                pc.onicecandidate = null;
                resolve(match[1]);
            }
        };
        
        setTimeout(() => {
            if (!ipFound) {
                resolve(null);
            }
        }, 1000); // 1-second timeout
    });
};