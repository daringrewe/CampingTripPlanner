import React from 'react';
import {
  Navigation,
  Clock,
  Milestone,
  Fuel,
  Compass,
  ArrowRight,
  Share2,
  Printer
} from 'lucide-react';
import { LocationPoint, formatDuration } from '../utils/geo';

interface RouteLegInfo {
  startName: string;
  endName: string;
  distanceMiles: number;
  durationSeconds: number;
}

interface ItinerarySummaryProps {
  home: LocationPoint | null;
  destinations: LocationPoint[];
  isRoundTrip: boolean;
  totalMiles: number;
  totalDurationSeconds: number;
  legs: RouteLegInfo[];
}

export function ItinerarySummary({
  home,
  destinations,
  isRoundTrip,
  totalMiles,
  totalDurationSeconds,
  legs,
}: ItinerarySummaryProps) {
  if (!home || destinations.length === 0) return null;

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Top Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-stone-400 block">
            Trip Overview
          </span>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-white font-bold text-lg font-['Outfit',sans-serif]">
              <Milestone className="w-5 h-5 text-emerald-400" />
              <span>{Math.round(totalMiles)} miles</span>
            </div>
            <div className="flex items-center gap-1.5 text-white font-bold text-lg font-['Outfit',sans-serif]">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>{formatDuration(totalDurationSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium">
            {destinations.length} destination{destinations.length > 1 ? 's' : ''}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium">
            {isRoundTrip ? 'Round Trip' : 'One-way Trip'}
          </span>
        </div>
      </div>

      {/* Leg by Leg Route Breakdown */}
      {legs.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block">
            Driving Legs & ETAs
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {legs.map((leg, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 truncate">
                    <span className="text-stone-300 font-medium truncate block">
                      {leg.startName} <ArrowRight className="inline w-3 h-3 text-stone-500 mx-1" /> {leg.endName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="font-semibold text-white">{leg.distanceMiles} mi</span>
                  <span className="text-stone-400 font-mono text-[11px]">{formatDuration(leg.durationSeconds)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
