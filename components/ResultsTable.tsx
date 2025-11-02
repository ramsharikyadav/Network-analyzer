import React from 'react';
import { Device } from '../types';
import { Spinner } from './Spinner';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { getDeviceVisuals } from '../utils/deviceUtils';
import { WarningIcon } from './icons/WarningIcon';

interface ResultsTableProps {
    devices: Device[];
    onViewDetails: (device: Device) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ devices, onViewDetails }) => {
    return (
        <div className="overflow-x-auto bg-white/50 rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Ports</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Details</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {devices.map((device) => {
                        const { Icon, colorClass } = getDeviceVisuals(device.category);
                        const isConflict = !!device.conflict;
                        return (
                            <tr key={device.ip} className={`transition-colors duration-150 ${isConflict ? 'bg-red-50 ring-2 ring-red-400' : 'hover:bg-gray-50'}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-sky-600">
                                    <div className="flex items-center gap-2">
                                         {isConflict && <WarningIcon className="h-5 w-5 text-red-500" />}
                                         {device.ip}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {isConflict ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Potential Conflict
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Online
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                                    {device.openPorts.join(', ') || 'None found'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {device.isAnalyzing ? (
                                        <span className="text-gray-500">...</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-5 w-5 ${colorClass}`} />
                                            <span>{device.category}</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {device.isAnalyzing ? (
                                        <div className="flex items-center gap-2">
                                            <Spinner />
                                            <span>Analyzing...</span>
                                        </div>
                                    ) : (
                                        <span className="truncate max-w-xs block">{device.analysis}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onViewDetails(device)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                        Details <ChevronRightIcon />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};