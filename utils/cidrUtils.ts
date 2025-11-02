const ipToLong = (ip: string): number => {
    // Use >>> 0 to ensure the result is an unsigned 32-bit integer.
    return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0;
};

const longToIp = (long: number): string => {
    return `${(long >>> 24)}.${(long >> 16) & 255}.${(long >> 8) & 255}.${long & 255}`;
};

/**
 * Parses a CIDR string (e.g., "192.168.1.0/24") and returns a list of IP addresses in that range.
 * @param cidr The CIDR string to parse.
 * @returns An object containing either a list of IPs or an error message.
 */
export const parseCidr = (cidr: string): { ipList: string[], error?: string } => {
    const [ip, maskStr] = cidr.split('/');
    if (!ip || !maskStr) {
        return { ipList: [], error: 'Invalid CIDR format. Expected format: X.X.X.X/Y' };
    }

    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return { ipList: [], error: 'Invalid IP address format in CIDR.' };
    }

    const mask = parseInt(maskStr, 10);
    if (isNaN(mask) || mask < 1 || mask > 32) {
        return { ipList: [], error: 'Invalid CIDR mask. Must be between 1 and 32.' };
    }

    const hostBits = 32 - mask;
    // Use Math.pow(2, hostBits) for total addresses in the block.
    const totalAddresses = Math.pow(2, hostBits);
    
    // Set a reasonable limit for browser-based scanning to prevent crashes.
    const MAX_SCAN_SIZE = 1024; 
    if (totalAddresses > MAX_SCAN_SIZE) {
         return { ipList: [], error: `Network size is too large (${totalAddresses} addresses). Maximum allowed is ${MAX_SCAN_SIZE} (a /22 network).` };
    }

    const ipLong = ipToLong(ip);
    
    // Create the mask as a 32-bit integer.
    const maskLong = -1 << (32 - mask);

    const networkLong = ipLong & maskLong;
    const broadcastLong = networkLong | (~maskLong >>> 0);

    const ipList: string[] = [];
    
    // For /32, scan the single IP. For /31, scan both IPs in the point-to-point link.
    // For all other networks, scan the host range (excluding network and broadcast addresses).
    const firstHost = mask >= 31 ? networkLong : networkLong + 1;
    const lastHost = mask >= 31 ? broadcastLong : broadcastLong - 1;

    // A special case for /32 where firstHost > lastHost with the above logic.
     if (mask === 32) {
        ipList.push(longToIp(ipLong));
        return { ipList };
    }
    
    if (firstHost > lastHost) {
        return { ipList: [], error: 'No scannable hosts in this CIDR range.' };
    }
    
    for (let i = firstHost; i <= lastHost; i++) {
        ipList.push(longToIp(i));
    }
    
    return { ipList };
};
