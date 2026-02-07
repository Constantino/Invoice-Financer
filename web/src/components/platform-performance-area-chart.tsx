"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/format";

export interface MonthlyData {
    month: string;
    collateralUnderManagement: number;
    totalCapitalLoaned: number;
    realizedYield: number;
    unrealizedYield: number;
    delinquentRecovery: number;
    managementFeeIncome: number;
}

interface PlatformPerformanceAreaChartProps {
    data: MonthlyData[];
}

export function PlatformPerformanceAreaChart({ data }: PlatformPerformanceAreaChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<{
        left: number;
        top: number;
        transform: string;
    } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const colors = {
        realizedYield: "#22c55e",
        unrealizedYield: "#6b7280",
        delinquentRecovery: "#eab308",
        managementFeeIncome: "#3b82f6",
    };

    const maxValue = Math.max(
        ...data.flatMap((d) => [
            d.realizedYield,
            d.unrealizedYield,
            d.delinquentRecovery,
            d.managementFeeIncome,
        ]),
        1
    );

    const scaleY = (value: number) =>
        chartHeight - (value / maxValue) * chartHeight;
    const scaleX = (index: number) =>
        (index / Math.max(data.length - 1, 1)) * chartWidth;

    const createAreaPath = (values: number[]) => {
        let path = `M ${padding.left} ${padding.top + chartHeight} `;
        values.forEach((value, index) => {
            const x = padding.left + scaleX(index);
            const y = padding.top + scaleY(value);
            path += `L ${x} ${y} `;
        });
        path += `L ${padding.left + chartWidth} ${padding.top + chartHeight} Z`;
        return path;
    };

    const createLinePath = (values: number[]) => {
        let path = "";
        values.forEach((value, index) => {
            const x = padding.left + scaleX(index);
            const y = padding.top + scaleY(value);
            path += index === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `;
        });
        return path;
    };

    const realizedData = data.map((d) => d.realizedYield);
    const unrealizedData = data.map((d) => d.unrealizedYield);
    const recoveryData = data.map((d) => d.delinquentRecovery);
    const feeData = data.map((d) => d.managementFeeIncome);

    const monthLabels = data.map((d) =>
        new Date(d.month).toLocaleDateString("en-US", { month: "short" })
    );

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || !containerRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const svgScaleX = svgRect.width / width;
        const mouseX = (e.clientX - svgRect.left) / svgScaleX;

        if (mouseX < padding.left || mouseX > padding.left + chartWidth) {
            setHoveredIndex(null);
            setTooltipPosition(null);
            return;
        }

        let closestIndex = 0;
        let minDistance = Infinity;
        for (let i = 0; i < data.length; i++) {
            const pointX = padding.left + scaleX(i);
            const distance = Math.abs(mouseX - pointX);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }
        setHoveredIndex(closestIndex);
        setTooltipPosition({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top,
        });
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltipPosition(null);
    };

    const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
    const hoveredMonth = hoveredData
        ? new Date(hoveredData.month).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
          })
        : null;

    useEffect(() => {
        if (tooltipPosition && containerRef.current) {
            const tooltipWidth = 220;
            const tooltipHeight = 150;
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const spaceOnRight = containerWidth - tooltipPosition.x;
            const spaceOnLeft = tooltipPosition.x;
            const showOnLeft =
                spaceOnRight < tooltipWidth && spaceOnLeft > tooltipWidth;
            let left = showOnLeft
                ? tooltipPosition.x - tooltipWidth - 10
                : Math.min(
                      tooltipPosition.x + 15,
                      containerWidth - tooltipWidth - 10
                  );
            left = Math.max(10, left);
            const spaceAbove = tooltipPosition.y;
            const spaceBelow = containerHeight - tooltipPosition.y;
            const showAbove =
                spaceBelow < tooltipHeight && spaceAbove > tooltipHeight;
            let top = showAbove
                ? tooltipPosition.y - tooltipHeight - 10
                : tooltipPosition.y + 10;
            const transform = showAbove ? "translateY(-100%)" : "translateY(0)";
            top = Math.max(
                10,
                Math.min(top, containerHeight - tooltipHeight - 10)
            );
            setTooltipStyle({ left, top, transform });
        } else {
            setTooltipStyle(null);
        }
    }, [tooltipPosition]);

    if (data.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className="w-full overflow-x-auto relative"
        >
            <svg
                ref={svgRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="overflow-visible cursor-crosshair"
                style={{ maxWidth: "100%", height: "auto" }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = padding.top + chartHeight * ratio;
                    return (
                        <line
                            key={ratio}
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + chartWidth}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                        />
                    );
                })}

                <path
                    d={createAreaPath(realizedData)}
                    fill={colors.realizedYield}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(unrealizedData)}
                    fill={colors.unrealizedYield}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(recoveryData)}
                    fill={colors.delinquentRecovery}
                    fillOpacity="0.2"
                />
                <path
                    d={createAreaPath(feeData)}
                    fill={colors.managementFeeIncome}
                    fillOpacity="0.2"
                />

                <path
                    d={createLinePath(realizedData)}
                    fill="none"
                    stroke={colors.realizedYield}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(unrealizedData)}
                    fill="none"
                    stroke={colors.unrealizedYield}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(recoveryData)}
                    fill="none"
                    stroke={colors.delinquentRecovery}
                    strokeWidth="2"
                />
                <path
                    d={createLinePath(feeData)}
                    fill="none"
                    stroke={colors.managementFeeIncome}
                    strokeWidth="2"
                />

                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const value = maxValue * (1 - ratio);
                    const y = padding.top + chartHeight * ratio;
                    return (
                        <text
                            key={ratio}
                            x={padding.left - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="#6b7280"
                        >
                            ${(value / 1000).toFixed(0)}k
                        </text>
                    );
                })}

                {monthLabels.map((label, index) => (
                    <text
                        key={index}
                        x={padding.left + scaleX(index)}
                        y={height - padding.bottom + 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6b7280"
                    >
                        {label}
                    </text>
                ))}

                <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={padding.top + chartHeight}
                    stroke="#d1d5db"
                    strokeWidth="1"
                />
                <line
                    x1={padding.left}
                    y1={padding.top + chartHeight}
                    x2={padding.left + chartWidth}
                    y2={padding.top + chartHeight}
                    stroke="#d1d5db"
                    strokeWidth="1"
                />

                {hoveredIndex !== null && (
                    <>
                        <line
                            x1={padding.left + scaleX(hoveredIndex)}
                            y1={padding.top}
                            x2={padding.left + scaleX(hoveredIndex)}
                            y2={padding.top + chartHeight}
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            opacity="0.6"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(realizedData[hoveredIndex])}
                            r="4"
                            fill={colors.realizedYield}
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(unrealizedData[hoveredIndex])}
                            r="4"
                            fill={colors.unrealizedYield}
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(recoveryData[hoveredIndex])}
                            r="4"
                            fill={colors.delinquentRecovery}
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={padding.left + scaleX(hoveredIndex)}
                            cy={padding.top + scaleY(feeData[hoveredIndex])}
                            r="4"
                            fill={colors.managementFeeIncome}
                            stroke="white"
                            strokeWidth="2"
                        />
                    </>
                )}
            </svg>

            {hoveredIndex !== null && hoveredData && tooltipStyle && (
                <div
                    className="absolute bg-background border border-border rounded-lg shadow-lg p-3 z-50 pointer-events-none min-w-[200px]"
                    style={{
                        left: `${tooltipStyle.left}px`,
                        top: `${tooltipStyle.top}px`,
                        transform: tooltipStyle.transform,
                    }}
                >
                    <div className="text-xs font-semibold text-foreground mb-2 border-b border-border pb-1">
                        {hoveredMonth}
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: colors.realizedYield }}
                            />
                            <span className="text-muted-foreground">
                                Realized Yield:
                            </span>
                            <span className="font-medium text-foreground">
                                {formatCurrency(hoveredData.realizedYield)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: colors.unrealizedYield,
                                }}
                            />
                            <span className="text-muted-foreground">
                                Unrealized Yield:
                            </span>
                            <span className="font-medium text-foreground">
                                {formatCurrency(hoveredData.unrealizedYield)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: colors.delinquentRecovery,
                                }}
                            />
                            <span className="text-muted-foreground">
                                Delinquent Recovery:
                            </span>
                            <span className="font-medium text-foreground">
                                {formatCurrency(hoveredData.delinquentRecovery)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: colors.managementFeeIncome,
                                }}
                            />
                            <span className="text-muted-foreground">
                                Management Fee:
                            </span>
                            <span className="font-medium text-foreground">
                                {formatCurrency(
                                    hoveredData.managementFeeIncome
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-1.5 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: colors.realizedYield }}
                    />
                    <span className="text-foreground">Realized Yield</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: colors.unrealizedYield }}
                    />
                    <span className="text-foreground">Unrealized Yield</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded"
                        style={{
                            backgroundColor: colors.delinquentRecovery,
                        }}
                    />
                    <span className="text-foreground">
                        Delinquent Recovery
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded"
                        style={{
                            backgroundColor: colors.managementFeeIncome,
                        }}
                    />
                    <span className="text-foreground">
                        Management Fee Income
                    </span>
                </div>
            </div>
        </div>
    );
}
