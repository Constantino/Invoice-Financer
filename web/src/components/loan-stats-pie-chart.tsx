"use client";

import type { LoanStats } from "@/types/loans";

interface LoanStatsPieChartProps {
    stats: LoanStats;
}

export function LoanStatsPieChart({ stats }: LoanStatsPieChartProps) {
    const { active, paid, defaulted, listed } = stats;
    const total = active + paid + defaulted + listed;

    const colors = {
        active: "#eab308",
        paid: "#22c55e",
        defaulted: "#ef4444",
        listed: "#3b82f6",
    };

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-4">
                <div className="w-48 h-48 rounded-full border-2 border-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No data</span>
                </div>
            </div>
        );
    }

    const calculateAngle = (value: number) => (value / total) * 360;
    const size = 180;
    const radius = 75;
    const centerX = size / 2;
    const centerY = size / 2;

    const createArcPath = (
        startAngle: number,
        endAngle: number,
        innerRadius = 0,
        outerRadius = radius
    ) => {
        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        const x1 = centerX + Math.cos(startRad) * outerRadius;
        const y1 = centerY + Math.sin(startRad) * outerRadius;
        const x2 = centerX + Math.cos(endRad) * outerRadius;
        const y2 = centerY + Math.sin(endRad) * outerRadius;
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        if (innerRadius === 0) {
            return `M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        }
        const x3 = centerX + Math.cos(startRad) * innerRadius;
        const y3 = centerY + Math.sin(startRad) * innerRadius;
        const x4 = centerX + Math.cos(endRad) * innerRadius;
        const y4 = centerY + Math.sin(endRad) * innerRadius;
        return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x3} ${y3} Z`;
    };

    let currentAngle = 0;
    const activeAngle = calculateAngle(active);
    const paidAngle = calculateAngle(paid);
    const defaultedAngle = calculateAngle(defaulted);
    const listedAngle = calculateAngle(listed);

    const activeStart = currentAngle;
    const activeEnd = currentAngle + activeAngle;
    currentAngle = activeEnd;
    const paidStart = currentAngle;
    const paidEnd = currentAngle + paidAngle;
    currentAngle = paidEnd;
    const defaultedStart = currentAngle;
    const defaultedEnd = currentAngle + defaultedAngle;
    currentAngle = defaultedEnd;
    const listedStart = currentAngle;
    const listedEnd = currentAngle + listedAngle;

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {active > 0 && (
                    <path
                        d={createArcPath(activeStart, activeEnd)}
                        fill={colors.active}
                        stroke="white"
                        strokeWidth="1"
                    />
                )}
                {paid > 0 && (
                    <path
                        d={createArcPath(paidStart, paidEnd)}
                        fill={colors.paid}
                        stroke="white"
                        strokeWidth="1"
                    />
                )}
                {defaulted > 0 && (
                    <path
                        d={createArcPath(defaultedStart, defaultedEnd)}
                        fill={colors.defaulted}
                        stroke="white"
                        strokeWidth="1"
                    />
                )}
                {listed > 0 && (
                    <path
                        d={createArcPath(listedStart, listedEnd)}
                        fill={colors.listed}
                        stroke="white"
                        strokeWidth="1"
                    />
                )}
            </svg>
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.active }}
                    />
                    <span className="text-foreground">Active: {active}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.paid }}
                    />
                    <span className="text-foreground">Paid: {paid}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.defaulted }}
                    />
                    <span className="text-foreground">Defaulted: {defaulted}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.listed }}
                    />
                    <span className="text-foreground">Listed: {listed}</span>
                </div>
            </div>
        </div>
    );
}
