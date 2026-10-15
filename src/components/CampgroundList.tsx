import React, { useState } from 'react';
import {
  Tent,
  Plus,
  Check,
  ChevronRight,
  Accessibility,
  Dog,
  Zap,
  Navigation,
  HelpCircle,
  Filter,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { ParkSummary, Campsite } from '../data/campsites';
import { MatchEvaluation, TripFilters } from '../utils/campsiteMatcher';

interface CampgroundListProps {
  campgrounds: {
    park: ParkSummary;
    distanceFromRoute: number;
    matchingSites: MatchEvaluation[];
  }[];
  filters: TripFilters;
  onAddAsStop: (park: ParkSummary) => void;
  selectedPark: ParkSummary | null;
  onSelectPark: (park: ParkSummary | null) => void;
  destinations: { name: string }[];
}

export function CampgroundList({
  campgrounds,
  filters,
  onAddAsStop,
  selectedPark,
  onSelectPark,
  destinations,
}: CampgroundListProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'perfect' | 'electric' | 'ada'>('all');
  const [expandedParkName, setExpandedParkName] = useState<string | null>(null);

  // Filter list
  const filteredCampgrounds = campgrounds.filter((c) => {
    if (filterMode === 'perfect') {
      return c.matchingSites.some((s) => s.status === 'perfect');
    }
    if (filterMode === 'electric') {
      return c.matchingSites.some(
        (s) => s.campsite.electric30amp || s.campsite.electric50amp || s.campsite.siteType.includes('Electric')
      );
    }
    if (filterMode === 'ada') {
      return c.matchingSites.some((s) => s.campsite.adaAccessible === true);
    }
    return true;
  });

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header & Filters */}
      <div className="p-4 border-b border-stone-800 bg-stone-950/60">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Tent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Campgrounds Along Route
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {campgrounds.length} found
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                Within {filters.maxCorridorDistanceMiles} miles of your planned path
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { id: 'all', label: 'All Along Route' },
            { id: 'perfect', label: '⭐ Best Fits Only' },
            { id: 'electric', label: '⚡ Electric Sites' },
            { id: 'ada', label: '♿ Confirmed ADA' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterMode(pill.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                filterMode === pill.id
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Note on data */}
        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-[10px] text-stone-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>Note: Blank cells in park data indicate unknown, not no. Sites with unverified attributes are marked as potential matches.</span>
        </div>
      </div>

      {/* Campground Cards List */}
      <div className="p-3 overflow-y-auto space-y-2.5 flex-1 max-h-[500px]">
        {filteredCampgrounds.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            No campgrounds match your active filter within {filters.maxCorridorDistanceMiles} miles of the route.
            <div className="mt-2">
              <button
                onClick={() => setFilterMode('all')}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Reset filter to show all
              </button>
            </div>
          </div>
        ) : (
          filteredCampgrounds.map(({ park, distanceFromRoute, matchingSites }) => {
            const isAlreadyStop = destinations.some((d) => d.name.includes(park.name));
            const isExpanded = expandedParkName === park.name;

            return (
              <div
                key={park.name}
                className="bg-stone-950/80 border border-stone-800 hover:border-stone-700 rounded-xl p-3 transition shadow-sm"
              >
                {/* Top Row: Name and Detour Distance */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-xs hover:text-emerald-400 transition cursor-pointer"
                        onClick={() => setExpandedParkName(isExpanded ? null : park.name)}>
                      {park.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 block">
                      {park.county} County • {park.tourismRegion} MN • {park.parkType}
                    </span>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                      {Math.round(distanceFromRoute * 10) / 10} mi detour
                    </span>
                  </div>
                </div>

                {/* Match highlights */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-300 font-medium">
                    ⛺ <strong className="text-white">{matchingSites.length}</strong> matching site{matchingSites.length > 1 ? 's' : ''}
                  </span>

                  {park.maxPadLength > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-300">
                      Up to {park.maxPadLength}ft pad
                    </span>
                  )}

                  {park.adaCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium flex items-center gap-1">
                      <Accessibility className="w-3 h-3" /> {park.adaCount} ADA site{park.adaCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-stone-500" /> ADA: Check sites
                    </span>
                  )}

                  {park.petFriendlyCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-950/40 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
                      <Dog className="w-3 h-3" /> Pets OK
                    </span>
                  )}
                </div>

                {/* Actions & Expand Site Details */}
                <div className="mt-2.5 pt-2 border-t border-stone-900 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedParkName(isExpanded ? null : park.name)}
                    className="text-[11px] text-stone-400 hover:text-stone-200 underline font-medium flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Hide Specific Sites' : `Explore ${matchingSites.length} Sites`}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  <button
                    disabled={isAlreadyStop}
                    onClick={() => onAddAsStop(park)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                      isAlreadyStop
                        ? 'bg-stone-800 text-stone-500 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    {isAlreadyStop ? (
                      <>
                        <Check className="w-3 h-3" /> In Route
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" /> Add as Stop
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Individual Sites Breakdown */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                      Available Campsites ({matchingSites.length})
                    </span>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {matchingSites.slice(0, 15).map(({ campsite: site, status, tags, reasons, unknowns }) => (
                        <div
                          key={site.id}
                          className="p-2 rounded-lg bg-stone-900 border border-stone-800/80 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {site.campground} — Site {site.siteName}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                status === 'perfect'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : status === 'good'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-stone-800 text-stone-400'
                              }`}
                            >
                              {status === 'perfect' ? 'Verified Match' : status === 'good' ? 'Good Fit' : 'Potential'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 text-[10px] text-stone-300">
                            <span className="text-stone-400">{site.siteType}</span>
                            {site.padLengthFt && <span>• {site.padLengthFt}ft driveway</span>}
                            {site.padSurface && <span>• {site.padSurface}</span>}
                            {site.electric30amp && <span>• 30A</span>}
                            {site.electric50amp && <span>• 50A</span>}
                            {site.adaAccessible === true && <span className="text-emerald-400 font-semibold">• ADA Accessible</span>}
                            {site.adaAccessible === null && <span className="text-stone-400">• ADA Unknown</span>}
                            {site.waterfront && <span className="text-cyan-400">• Waterfront</span>}
                          </div>

                          {/* Distance to facilities */}
                          <div className="text-[10px] text-stone-500 flex flex-wrap gap-2">
                            {site.feetToRestroom && <span>Restroom: {site.feetToRestroom} ft</span>}
                            {site.feetToWater && <span>Water: {site.feetToWater} ft</span>}
                            {site.feetToShower && <span>Shower: {site.feetToShower} ft</span>}
                          </div>
                        </div>
                      ))}
                      {matchingSites.length > 15 && (
                        <div className="text-center text-[10px] text-stone-400 italic py-1">
                          + {matchingSites.length - 15} more eligible sites in this park
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
