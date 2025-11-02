import React, { useMemo, useState, useRef } from 'react';
import { Device } from '../types';
import { getDeviceVisuals } from '../utils/deviceUtils';
import { RouterIcon } from './icons/devices/RouterIcon';
import { ExportIcon } from './icons/ExportIcon';


interface NetworkGraphProps {
    devices: Device[];
    onViewDetails: (device: Device) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ devices, onViewDetails }) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 80;

    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [hoveredNodeIp, setHoveredNodeIp] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const nodes = useMemo(() => {
        const deviceCount = devices.length;
        if (deviceCount === 0) return [];
        
        return devices.map((device, index) => {
            // Distribute nodes evenly in a circle
            const angle = (index / deviceCount) * 2 * Math.PI - Math.PI / 2; // Start from top
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            return { ...device, x, y };
        });
    }, [devices, centerX, centerY, radius]);

    const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
        event.preventDefault();
        const zoomFactor = 1.1;
        const { deltaY } = event;
        const newScale = deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
        const clampedScale = Math.max(0.2, Math.min(newScale, 5));

        if (svgRef.current) {
            const svgRect = svgRef.current.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left;
            const mouseY = event.clientY - svgRect.top;

            const newX = mouseX - (mouseX - transform.x) * (clampedScale / transform.scale);
            const newY = mouseY - (mouseY - transform.y) * (clampedScale / transform.scale);
            
            setTransform({ scale: clampedScale, x: newX, y: newY });
        }
    };

    const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
        setIsPanning(true);
        setPanStart({ x: event.clientX - transform.x, y: event.clientY - transform.y });
        event.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!isPanning) return;
        event.preventDefault();
        const newX = event.clientX - panStart.x;
        const newY = event.clientY - panStart.y;
        setTransform(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUpOrLeave = (event: React.MouseEvent<SVGSVGElement>) => {
        if (isPanning) {
            setIsPanning(false);
            event.currentTarget.style.cursor = 'grab';
        }
    };

    const resetView = () => {
        setTransform({ scale: 1, x: 0, y: 0 });
    };

    const handleExport = () => {
        if (!svgRef.current) return;

        // Create a clone to avoid modifying the displayed SVG
        const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
        
        // Add a white background for better standalone viewing
        svgClone.style.backgroundColor = 'white';

        // Serialize the SVG to a string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgClone);

        // Create a Blob and a download link
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'network-topology.svg';

        // Trigger the download
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const hoveredNode = nodes.find(n => n.ip === hoveredNodeIp);

    if (devices.length === 0) {
        return <div className="text-center text-gray-600 py-10">No devices to visualize.</div>;
    }

    return (
        <div className="relative w-full flex justify-center items-center bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200 p-4 overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    aria-label="Export graph as SVG"
                >
                    <ExportIcon />
                    Export
                </button>
                <button 
                    onClick={resetView}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    aria-label="Reset view"
                >
                    Reset View
                </button>
            </div>
            <svg 
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-auto max-h-[600px] cursor-grab"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
            >
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
                    {/* Lines from center to each node */}
                    {nodes.map(node => {
                        const isHovered = hoveredNodeIp === node.ip;
                        return (
                             <line
                                key={`line-${node.ip}`}
                                x1={centerX}
                                y1={centerY}
                                x2={node.x}
                                y2={node.y}
                                className={`transition-all duration-200 ${isHovered ? 'stroke-blue-500' : 'stroke-gray-300'}`}
                                strokeWidth={isHovered ? 2 : 1}
                            />
                        )
                    })}

                    {/* Central Router Node */}
                    <g transform={`translate(${centerX}, ${centerY})`}>
                        <circle r="40" className="fill-gray-100 stroke-gray-300" strokeWidth="2" />
                        <foreignObject x="-18" y="-18" width="36" height="36" style={{ filter: 'url(#glow)' }}>
                            <RouterIcon className="text-sky-600 h-full w-full"/>
                        </foreignObject>
                        <text y="55" textAnchor="middle" className="fill-gray-500 text-xs uppercase tracking-wider font-semibold">Router / Gateway</text>
                    </g>
                    
                    {/* Device Nodes */}
                    {nodes.map(node => {
                        const { Icon, colorClass, baseColorClass } = getDeviceVisuals(node.category);
                        const isConflict = !!node.conflict;
                        const isHovered = hoveredNodeIp === node.ip;
                        const isDimmed = hoveredNodeIp !== null && !isHovered;

                        return (
                            <g
                                key={`node-${node.ip}`}
                                transform={`translate(${node.x}, ${node.y})`}
                                onClick={() => onViewDetails(node)}
                                onMouseEnter={() => setHoveredNodeIp(node.ip)}
                                onMouseLeave={() => setHoveredNodeIp(null)}
                                className={`cursor-pointer group transition-opacity duration-200 ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
                                aria-label={`Device at ${node.ip}, category ${node.category}`}
                            >
                                {isConflict && (
                                    <circle r="42" className="fill-none stroke-red-500" strokeWidth="3">
                                        <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                                    </circle>
                                )}
                                <circle
                                    r="35"
                                    className={`${baseColorClass} transition-all stroke-gray-300 ${isConflict ? 'stroke-red-300' : 'group-hover:stroke-blue-500'}`}
                                    strokeWidth="2"
                                />
                                <foreignObject x="-16" y="-16" width="32" height="32">
                                <Icon className={`${colorClass} h-full w-full`} />
                                </foreignObject>
                                <text
                                    y="50"
                                    textAnchor="middle"
                                    className="fill-gray-600 text-sm font-mono group-hover:fill-gray-900 transition-colors"
                                >
                                    {node.ip.split('.').pop()}
                                </text>
                            </g>
                        );
                    })}

                    {/* Tooltip */}
                    {hoveredNode && (
                        <foreignObject
                            x={hoveredNode.x + 15}
                            y={hoveredNode.y - 45}
                            width="160"
                            height="100"
                            className="pointer-events-none overflow-visible"
                        >
                            {/* FIX: The 'xmlns' attribute is required for the div to render correctly inside a foreignObject, but it is not a valid attribute for a div in React's TypeScript types. Using a spread object bypasses this type check. */}
                            <div
                                {...{ xmlns: "http://www.w3.org/1999/xhtml" }}
                                className="bg-gray-800/90 text-white rounded-md p-2 shadow-lg text-xs transition-opacity duration-200"
                            >
                                <div className="font-bold font-mono">{hoveredNode.ip}</div>
                                <div className="mt-1">{hoveredNode.category}</div>
                            </div>
                        </foreignObject>
                    )}
                </g>
            </svg>
        </div>
    );
};