import React from 'react';
import { Compass, Sparkles, MapPin, Tent, RotateCcw } from 'lucide-react';
import { LocationPoint } from '../utils/geo';
import { TripFilters } from '../utils/campsiteMatcher';

interface HeaderProps {
  onSelectPreset: (preset: {
    home: LocationPoint;
    destinations: LocationPoint[];
    filters: Partial<TripFilters>;
  }) => void;
  onReset: () => void;
  totalStops: number;
  isTripComplete: boolean;
  missingItemsCount: number;
  onOpenPrompt: () => void;
}

export function Header({
  onSelectPreset,
  onReset,
  totalStops,
  isTripComplete,
  missingItemsCount,
  onOpenPrompt,
}: HeaderProps) {
  const presets = [
    {
      title: 'North Shore Lighthouse & Waterfalls',
      desc: 'Duluth → Gooseberry → Split Rock → Tettegouche',
      home: { id: 'home', name: 'Minneapolis, MN', lat: 44.9778, lng: -93.265, isHome: true },
      destinations: [
        { id: 'dest-1', name: 'Duluth Canal Park', lat: 46.7867, lng: -92.1005 },
        { id: 'dest-2', name: 'Gooseberry Falls State Park', lat: 47.1426, lng: -91.465 },
        { id: 'dest-3', name: 'Split Rock Lighthouse State Park', lat: 47.1957, lng: -91.3786 },
        { id: 'dest-4', name: 'Tettegouche State Park (Palisade Head)', lat: 47.335, lng: -91.2 },
      ],
      filters: { campingStyle: 'rv' as const, rvLengthFt: 30, requiresElectric30: true, hasPets: true },
    },
    {
      title: 'Mississippi Headwaters & Northwoods',
      desc: 'Twin Cities → Mille Lacs Kathio → Cuyuna → Itasca',
      home: { id: 'home', name: 'St. Paul, MN', lat: 44.9537, lng: -93.09, isHome: true },
      destinations: [
        { id: 'dest-1', name: 'Mille Lacs Kathio State Park', lat: 46.1276, lng: -93.7692 },
        { id: 'dest-2', name: 'Cuyuna Country Recreation Area (Crosby)', lat: 46.4915, lng: -93.973 },
        { id: 'dest-3', name: 'Itasca State Park (Headwaters)', lat: 47.236, lng: -95.207 },
      ],
      filters: { campingStyle: 'tent' as const, partySize: 4, preferWaterfront: true },
    },
    {
      title: 'Southern Bluff Country & Caves',
      desc: 'Frontenac (Lake Pepin) → Whitewater → Forestville Mystery Cave',
      home: { id: 'home', name: 'Bloomington, MN', lat: 44.8408, lng: -93.2983, isHome: true },
      destinations: [
        { id: 'dest-1', name: 'Frontenac State Park', lat: 44.539, lng: -92.351 },
        { id: 'dest-2', name: 'Whitewater State Park', lat: 44.062, lng: -92.045 },
        { id: 'dest-3', name: 'Forestville Mystery Cave State Park', lat: 43.6291, lng: -92.22 },
      ],
      filters: { campingStyle: 'rv' as const, rvLengthFt: 25, requiresAda: true, strictAdaOnly: false },
    },
  ];

  return (
    <header className="bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-stone-950">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white font-['Outfit',sans-serif]">
                Minnesota <span className="text-emerald-400">CampRoute</span>
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MN State Parks & Trails
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Trip router & verified campsite matcher for Minnesota explorers
            </p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Missing info prompt button */}
          {!isTripComplete && (
            <button
              onClick={onOpenPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{missingItemsCount} {missingItemsCount === 1 ? 'detail' : 'details'} needed</span>
            </button>
          )}

          {/* Preset Trips Dropdown/Pills */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-800/80 p-1 rounded-xl border border-stone-700/60 text-xs">
            <span className="text-stone-400 px-2 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tours:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPreset(p)}
                className="px-2.5 py-1 rounded-lg bg-stone-700/60 hover:bg-emerald-600 hover:text-white text-stone-200 transition text-[11px] font-medium"
                title={p.desc}
              >
                {p.title.split(' ')[0]} {p.title.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 transition"
            title="Start New Trip"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
