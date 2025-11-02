import React from 'react';
import { ServerIcon } from '../components/icons/devices/ServerIcon';
import { RouterIcon } from '../components/icons/devices/RouterIcon';
import { WorkstationIcon } from '../components/icons/devices/WorkstationIcon';
import { PrinterIcon } from '../components/icons/devices/PrinterIcon';
import { NasIcon } from '../components/icons/devices/NasIcon';
import { IotIcon } from '../components/icons/devices/IotIcon';
import { MobileIcon } from '../components/icons/devices/MobileIcon';
import { DeviceUnknownIcon } from '../components/icons/devices/DeviceUnknownIcon';

interface DeviceVisuals {
    Icon: React.FC<{className?: string}>;
    colorClass: string;
    baseColorClass: string;
}

export const getDeviceVisuals = (category: string): DeviceVisuals => {
    switch (category.toLowerCase()) {
        case 'server':
            return { Icon: ServerIcon, colorClass: 'text-red-500', baseColorClass: 'fill-red-100' };
        case 'router':
            return { Icon: RouterIcon, colorClass: 'text-cyan-500', baseColorClass: 'fill-cyan-100' };
        case 'workstation':
            return { Icon: WorkstationIcon, colorClass: 'text-blue-500', baseColorClass: 'fill-blue-100' };
        case 'printer':
            return { Icon: PrinterIcon, colorClass: 'text-indigo-500', baseColorClass: 'fill-indigo-100' };
        case 'nas':
            return { Icon: NasIcon, colorClass: 'text-amber-500', baseColorClass: 'fill-amber-100' };
        case 'iot device':
            return { Icon: IotIcon, colorClass: 'text-teal-500', baseColorClass: 'fill-teal-100' };
        case 'mobile device':
            return { Icon: MobileIcon, colorClass: 'text-green-500', baseColorClass: 'fill-green-100' };
        case 'analyzing...':
             return { Icon: DeviceUnknownIcon, colorClass: 'text-gray-400', baseColorClass: 'fill-gray-200' };
        default:
            return { Icon: DeviceUnknownIcon, colorClass: 'text-gray-500', baseColorClass: 'fill-gray-100' };
    }
};