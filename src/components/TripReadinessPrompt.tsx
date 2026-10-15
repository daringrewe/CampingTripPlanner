import React from 'react';
import { AlertCircle, CheckCircle2, ChevronRight, Home, MapPin, Tent, Users, Accessibility, Dog } from 'lucide-react';
import { LocationPoint } from '../utils/geo';
import { TripFilters, CampingStyle } from '../utils/campsiteMatcher';

interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  isProvided: boolean;
  actionText: string;
  category: 'home' | 'destinations' | 'style' | 'party' | 'access';
}

interface TripReadinessPromptProps {
  home: LocationPoint | null;
  destinations: LocationPoint[];
  filters: TripFilters;
  onSetHome: (name: string, lat: number, lng: number) => void;
  onSelectCategoryTab: (tab: 'route' | 'gear' | 'party' | 'campgrounds') => void;
  onQuickAddDestination: (name: string, lat: number, lng: number) => void;
  onUpdateFilters: (patch: Partial<TripFilters>) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function TripReadinessPrompt({
  home,
  destinations,
  filters,
  onSetHome,
  onSelectCategoryTab,
  onQuickAddDestination,
  onUpdateFilters,
  isExpanded,
  onToggleExpanded,
}: TripReadinessPromptProps) {
  const items: ReadinessItem[] = [
    {
      id: 'home',
      label: 'Home Starting Point',
      description: home ? `Starting from ${home.name}` : 'Where does your Minnesota trip begin?',
      isProvided: Boolean(home && home.name),
      actionText: 'Set Starting City',
      category: 'home',
    },
    {
      id: 'destinations',
      label: 'Places to Visit',
      description:
        destinations.length > 0
          ? `${destinations.length} destination${destinations.length > 1 ? 's' : ''} planned`
          : 'Choose at least one Minnesota destination or state park to explore',
      isProvided: destinations.length > 0,
      actionText: 'Add Destinations',
      category: 'destinations',
    },
    {
      id: 'style',
      label: 'Camping Gear & Travel Mode',
      description:
        filters.campingStyle === 'rv'
          ? `RV / Camper (${filters.rvLengthFt} ft length)`
          : filters.campingStyle === 'tent'
          ? 'Tent Camping'
          : filters.campingStyle === 'backpack'
          ? 'Backpacking'
          : filters.campingStyle === 'canoe'
          ? 'Canoe / Water Trail'
          : 'Equestrian / Horse',
      isProvided: Boolean(filters.campingStyle),
      actionText: 'Specify Gear',
      category: 'style',
    },
    {
      id: 'party',
      label: 'Travelers & Pets',
      description: `${filters.partySize} ${filters.partySize === 1 ? 'person' : 'people'}, ${
        filters.hasPets ? 'Traveling with Pets 🐾' : 'No pets'
      }`,
      isProvided: filters.partySize > 0,
      actionText: 'Set Party Size',
      category: 'party',
    },
  ];

  const pendingItems = items.filter((i) => !i.isProvided);
  const isAllComplete = pendingItems.length === 0;

  if (isAllComplete && !isExpanded) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Trip details complete! We've routed your trip and filtered matching campgrounds.</span>
        </div>
        <button
          onClick={onToggleExpanded}
          className="text-emerald-400 hover:text-emerald-300 underline font-semibold shrink-0"
        >
          View Checklist
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-850 border border-amber-500/30 rounded-2xl p-4 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Trip Details Needed
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                {pendingItems.length} missing
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              Provide these details so we can calculate the best route and verify campsite suitability.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleExpanded}
          className="text-xs text-stone-400 hover:text-stone-200 underline"
        >
          {isExpanded ? 'Hide' : 'Expand'}
        </button>
      </div>

      {/* Progress Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-2 rounded-xl border text-xs flex flex-col justify-between transition ${
              item.isProvided
                ? 'bg-stone-900/60 border-emerald-500/30 text-stone-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">{item.label}</span>
              {item.isProvided ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <p className="text-[11px] text-stone-400 line-clamp-1">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Quick Action prompts if anything is missing */}
      {!home && (
        <div className="mt-2 p-3 bg-stone-900/80 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs">
            <span className="font-semibold text-white block">📍 Starting from home:</span>
            <span className="text-stone-400">Where are you departing from?</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onSetHome('Minneapolis, MN', 44.9778, -93.265)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              Minneapolis
            </button>
            <button
              onClick={() => onSetHome('St. Paul, MN', 44.9537, -93.09)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              St. Paul
            </button>
            <button
              onClick={() => onSetHome('Duluth, MN', 46.7867, -92.1005)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              Duluth
            </button>
            <button
              onClick={() => onSetHome('Rochester, MN', 44.0121, -92.4802)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              Rochester
            </button>
          </div>
        </div>
      )}

      {destinations.length === 0 && (
        <div className="mt-2 p-3 bg-stone-900/80 rounded-xl border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs">
            <span className="font-semibold text-white block">🌲 Choose places in MN to visit:</span>
            <span className="text-stone-400">Add popular MN destinations with 1 click:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onQuickAddDestination('Gooseberry Falls State Park', 47.1426, -91.465)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              + Gooseberry Falls
            </button>
            <button
              onClick={() => onQuickAddDestination('Itasca State Park (Headwaters)', 47.236, -95.207)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              + Itasca Headwaters
            </button>
            <button
              onClick={() => onQuickAddDestination('Cuyuna Country Recreation Area', 46.4915, -93.973)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              + Cuyuna Lakes
            </button>
            <button
              onClick={() => onQuickAddDestination('Whitewater State Park', 44.062, -92.045)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-emerald-600 text-stone-200 hover:text-white text-xs border border-stone-700 transition"
            >
              + Whitewater Bluffs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
