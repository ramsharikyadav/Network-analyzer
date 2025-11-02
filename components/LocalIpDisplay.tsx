import React from 'react';
import { Spinner } from './Spinner';
import { WarningIcon } from './icons/WarningIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { WindowsIcon } from './icons/WindowsIcon';
import { AppleIcon } from './icons/AppleIcon';
import { LinuxIcon } from './icons/LinuxIcon';

interface LocalIpDisplayProps {
    isLoading: boolean;
    ipAddress: string | null;
    error: string | null;
}

const ManualIpGuide: React.FC = () => (
    <div className="mt-4 text-left">
        <h4 className="font-semibold text-red-800">How to Find Your IP Manually</h4>
        <p className="text-sm text-red-700 mt-1">
            You can find your local IP address in your system settings. Once you have it, you can manually enter the network range (e.g., if your IP is <code className="bg-red-200 text-red-900 text-xs px-1 py-0.5 rounded">192.168.1.5</code>, try scanning <code className="bg-red-200 text-red-900 text-xs px-1 py-0.5 rounded">192.168.1.0/24</code>).
        </p>
        <div className="mt-3 space-y-3">
            <div className="flex items-start gap-3">
                <WindowsIcon />
                <div>
                    <p className="font-semibold text-sm text-gray-800">On Windows</p>
                    <p className="text-xs text-gray-600">Open Command Prompt and type <code className="bg-gray-200 text-sky-600 text-xs px-1.5 py-0.5 rounded">ipconfig</code>. Look for the "IPv4 Address".</p>
                </div>
            </div>
             <div className="flex items-start gap-3">
                <AppleIcon />
                <div>
                    <p className="font-semibold text-sm text-gray-800">On macOS</p>
                    <p className="text-xs text-gray-600">Open Terminal and type <code className="bg-gray-200 text-sky-600 text-xs px-1.5 py-0.5 rounded">ifconfig | grep "inet "</code>. Look for the address that starts with 192, 10, or 172.</p>
                </div>
            </div>
             <div className="flex items-start gap-3">
                <LinuxIcon />
                <div>
                    <p className="font-semibold text-sm text-gray-800">On Linux</p>
                    <p className="text-xs text-gray-600">Open a terminal and type <code className="bg-gray-200 text-sky-600 text-xs px-1.5 py-0.5 rounded">ip a</code> or <code className="bg-gray-200 text-sky-600 text-xs px-1.5 py-0.5 rounded">hostname -I</code>.</p>
                </div>
            </div>
        </div>
    </div>
);

export const LocalIpDisplay: React.FC<LocalIpDisplayProps> = ({ isLoading, ipAddress, error }) => {
    if (isLoading) {
        return (
            <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                <Spinner />
                <span className="text-gray-600">Detecting your local IP...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
                <WarningIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-red-800">IP Detection Failed</p>
                    <p className="text-sm text-red-700">{error}</p>
                    <ManualIpGuide />
                </div>
            </div>
        );
    }

    if (ipAddress) {
        return (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3">
                 <CheckCircleIcon />
                 <div>
                    <span className="font-semibold text-green-800">Your Detected Local IP:</span>
                    <code className="ml-2 bg-green-200 text-green-900 font-mono font-bold px-2 py-1 rounded-md">{ipAddress}</code>
                 </div>
            </div>
        );
    }

    return null; // Don't render anything if no action has been taken
};