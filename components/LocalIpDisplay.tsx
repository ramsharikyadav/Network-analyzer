import React from 'react';
import { Spinner } from './Spinner';
import { WarningIcon } from './icons/WarningIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface LocalIpDisplayProps {
    isLoading: boolean;
    ipAddress: string | null;
    error: string | null;
}

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