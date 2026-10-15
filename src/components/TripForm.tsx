import React, { useState } from 'react';
import {
  MapPin,
  Home,
  Navigation,
  Plus,
  Trash2,
  ArrowUpDown,
  Car,
  Tent,
  Truck,
  Footprints,
  Compass,
  Dog,
  Users,
  Accessibility,
  Zap,
  Waves,
  Trees,
  Check,
  ChevronDown,
  Sparkles,
  Search,
  GripVertical
} from 'lucide-react';
import { LocationPoint, optimizeRouteOrder } from '../utils/geo';
import { TripFilters, CampingStyle } from '../utils/campsiteMatcher';
import { POPULAR_MN_DESTINATIONS } from '../data/campsites';

interface TripFormProps {
  home: LocationPoint | null;
  onSetHome: (point: LocationPoint) => void;
  destinations: LocationPoint[];
  onAddDestination: (point: LocationPoint) => void;
  onRemoveDestination: (id: string) => void;
  onReorderDestinations: (newDestinations: LocationPoint[]) => void;
  onOptimizeOrder: () => void;
  isRoundTrip: boolean;
  onToggleRoundTrip: () => void;
  filters: TripFilters;
  onUpdateFilters: (patch: Partial<TripFilters>) => void;
  activeTab: 'route' | 'gear' | 'party' | 'amenities';
  onChangeActiveTab: (tab: 'route' | 'gear' | 'party' | 'amenities') => void;
}

export function TripForm({
  home,
  onSetHome,
  destinations,
  onAddDestination,
  onRemoveDestination,
  onReorderDestinations,
  onOptimizeOrder,
  isRoundTrip,
  onToggleRoundTrip,
  filters,
  onUpdateFilters,
  activeTab,
  onChangeActiveTab,
}: TripFormProps) {
  const [customSearch, setCustomSearch] = useState('');
  const [showPopularMenu, setShowPopularMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Quick Home City presets
  const homePresets = [
    { name: 'Minneapolis, MN', lat: 44.9778, lng: -93.265 },
    { name: 'St. Paul, MN', lat: 44.9537, lng: -93.09 },
    { name: 'Duluth, MN', lat: 46.7867, lng: -92.1005 },
    { name: 'Rochester, MN', lat: 44.0121, lng: -92.4802 },
    { name: 'St. Cloud, MN', lat: 45.5579, lng: -94.1632 },
    { name: 'Brainerd, MN', lat: 46.358, lng: -94.2008 },
    { name: 'Bemidji, MN', lat: 47.4736, lng: -94.8803 },
    { name: 'Moorhead, MN', lat: 46.8738, lng: -96.7678 },
  ];

  // Geolocation
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSetHome({
            id: 'home',
            name: 'Current Location',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isHome: true,
          });
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback to Minneapolis
          onSetHome({
            id: 'home',
            name: 'Minneapolis (Home)',
            lat: 44.9778,
            lng: -93.265,
            isHome: true,
          });
        }
      );
    }
  };

  const handleAddCustomDestination = () => {
    if (!customSearch.trim()) return;
    const match = POPULAR_MN_DESTINATIONS.find(
      (d) => d.name.toLowerCase().includes(customSearch.toLowerCase())
    );

    if (match) {
      onAddDestination({
        id: `dest-${Date.now()}`,
        name: match.name,
        lat: match.lat,
        lng: match.lng,
      });
      setCustomSearch('');
    } else {
      // Create waypoint inside MN center or approximate
      onAddDestination({
        id: `dest-${Date.now()}`,
        name: customSearch.trim(),
        lat: 46.5 + (Math.random() - 0.5) * 1.5,
        lng: -94.0 + (Math.random() - 0.5) * 1.5,
      });
      setCustomSearch('');
    }
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...destinations];
    const temp = copy[idx - 1];
    copy[idx - 1] = copy[idx];
    copy[idx] = temp;
    onReorderDestinations(copy);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === destinations.length - 1) return;
    const copy = [...destinations];
    const temp = copy[idx + 1];
    copy[idx + 1] = copy[idx];
    copy[idx] = temp;
    onReorderDestinations(copy);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const copy = [...destinations];
    const draggedItem = copy[draggedIndex];
    copy.splice(draggedIndex, 1);
    copy.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onReorderDestinations(copy);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-stone-800 bg-stone-950/60 p-1.5 gap-1 text-xs">
        <button
          onClick={() => onChangeActiveTab('route')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'route'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Route & Stops</span>
          {destinations.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-stone-900/60 text-[10px] flex items-center justify-center font-bold">
              {destinations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => onChangeActiveTab('gear')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'gear'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          {filters.campingStyle === 'rv' ? <Truck className="w-3.5 h-3.5" /> : <Tent className="w-3.5 h-3.5" />}
          <span>Camping Gear</span>
        </button>

        <button
          onClick={() => onChangeActiveTab('party')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'party'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Party & Needs</span>
        </button>

        <button
          onClick={() => onChangeActiveTab('amenities')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
            activeTab === 'amenities'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Amenities</span>
        </button>
      </div>

      {/* Tab 1: Route & Stops */}
      {activeTab === 'route' && (
        <div className="p-4 space-y-4">
          {/* Home Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Home className="w-3.5 h-3.5 text-emerald-400" /> Starting From (Home)
              </label>
              <button
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                Use GPS location
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={home?.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onSetHome({
                    id: 'home',
                    name: val,
                    lat: home?.lat || 44.9778,
                    lng: home?.lng || -93.265,
                    isHome: true,
                  });
                }}
                placeholder="Enter starting city or home address..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Quick city chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {homePresets.slice(0, 5).map((city) => (
                <button
                  key={city.name}
                  onClick={() =>
                    onSetHome({
                      id: 'home',
                      name: city.name,
                      lat: city.lat,
                      lng: city.lng,
                      isHome: true,
                    })
                  }
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition ${
                    home?.name === city.name
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {city.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-stone-800" />

          {/* Destinations Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Places in MN to Visit
              </label>
              {destinations.length >= 2 && (
                <button
                  onClick={onOptimizeOrder}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg transition"
                  title="Optimize route order for fastest driving time"
                >
                  <Sparkles className="w-3 h-3" /> Optimize Best Path
                </button>
              )}
            </div>

            {/* Input to add stop */}
            <div className="flex gap-2 mb-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customSearch}
                  onChange={(e) => setCustomSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDestination()}
                  placeholder="Search destination, park, lake, city..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleAddCustomDestination}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Quick destination suggestion accordion */}
            <div className="mb-3">
              <button
                onClick={() => setShowPopularMenu(!showPopularMenu)}
                className="w-full text-[11px] text-stone-400 hover:text-stone-200 flex items-center justify-between py-1 px-2 rounded-lg bg-stone-950/60 border border-stone-800"
              >
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-teal-400" /> Browse Popular MN Destinations
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showPopularMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showPopularMenu && (
                <div className="mt-1.5 p-2 bg-stone-950 border border-stone-800 rounded-xl max-h-48 overflow-y-auto space-y-1">
                  {POPULAR_MN_DESTINATIONS.map((dest) => {
                    const isAlreadyAdded = destinations.some((d) => d.name === dest.name);
                    return (
                      <div
                        key={dest.name}
                        className="flex items-center justify-between p-1.5 hover:bg-stone-800/60 rounded-lg text-xs group transition"
                      >
                        <div className="pr-2">
                          <span className="font-semibold text-stone-200 block text-[11px]">
                            {dest.name}
                          </span>
                          <span className="text-[10px] text-stone-400 block line-clamp-1">
                            {dest.description}
                          </span>
                        </div>
                        <button
                          disabled={isAlreadyAdded}
                          onClick={() => {
                            onAddDestination({
                              id: `dest-${Date.now()}-${Math.random()}`,
                              name: dest.name,
                              lat: dest.lat,
                              lng: dest.lng,
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition shrink-0 ${
                            isAlreadyAdded
                              ? 'bg-stone-800 text-stone-500 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {isAlreadyAdded ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of planned stops */}
            {destinations.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-800 text-center text-xs text-stone-500">
                No destinations added yet. Choose from popular highlights or search above.
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  Stops in Itinerary (Drag to reorder):
                </span>
                {destinations.map((dest, idx) => (
                  <div
                    key={dest.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      draggedIndex === idx
                        ? 'bg-emerald-950/40 border-emerald-500'
                        : 'bg-stone-950/80 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-stone-500 hover:text-stone-300">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-500/30">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          {dest.name}
                        </span>
                        {dest.isCampground && (
                          <span className="text-[10px] text-emerald-400 font-medium">
                            ⛺ Overnight Campground Stop
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="p-1 rounded text-stone-400 hover:text-stone-200 disabled:opacity-30 text-[10px]"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === destinations.length - 1}
                        className="p-1 rounded text-stone-400 hover:text-stone-200 disabled:opacity-30 text-[10px]"
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => onRemoveDestination(dest.id)}
                        className="p-1 rounded text-stone-500 hover:text-red-400 transition"
                        title="Remove stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Round trip toggle */}
            <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-300 font-medium">Return to Home (Round Trip)</span>
              <button
                onClick={onToggleRoundTrip}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                  isRoundTrip ? 'bg-emerald-600 justify-end' : 'bg-stone-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Camping Gear & Travel Mode */}
      {activeTab === 'gear' && (
        <div className="p-4 space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-200 block mb-2 uppercase tracking-wider text-[11px]">
              What are you traveling with?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rv', label: 'RV / Camper / Trailer', icon: Truck, desc: 'Requires driveway pad length & hookups' },
                { id: 'tent', label: 'Tent / Car Camping', icon: Tent, desc: 'Standard drive-in or cart-in tent sites' },
                { id: 'backpack', label: 'Backpack / Hike-In', icon: Footprints, desc: 'Primitive wilderness hike-in sites' },
                { id: 'canoe', label: 'Canoe / Watercraft', icon: Waves, desc: 'Water trail paddle-in boat sites' },
                { id: 'horse', label: 'Equestrian / Horse', icon: Compass, desc: 'Horse camp with corrals & trail access' },
              ].map((style) => {
                const Icon = style.icon;
                const isSelected = filters.campingStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => onUpdateFilters({ campingStyle: style.id as CampingStyle })}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{style.label}</span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-stone-500'}`} />
                    </div>
                    <span className="text-[10px] text-stone-400">{style.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RV Specific Configurations */}
          {filters.campingStyle === 'rv' && (
            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                RV Specifications
              </span>

              {/* RV Length Slider */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-stone-300">Rig Length:</span>
                  <span className="font-bold text-emerald-400 text-sm">{filters.rvLengthFt} ft</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={50}
                  step={1}
                  value={filters.rvLengthFt}
                  onChange={(e) => onUpdateFilters({ rvLengthFt: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-stone-400">
                  Filters campgrounds having pad length ≥ {filters.rvLengthFt} ft.
                </span>
              </div>

              {/* Hookups */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <span className="text-[11px] font-semibold text-stone-300 block">Electric Hookup:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.requiresElectric30}
                      onChange={(e) => onUpdateFilters({ requiresElectric30: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="text-xs text-stone-200 font-medium">30-Amp Electric</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.requiresElectric50}
                      onChange={(e) => onUpdateFilters({ requiresElectric50: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="text-xs text-stone-200 font-medium">50-Amp Electric</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.requiresPullThrough}
                      onChange={(e) => onUpdateFilters({ requiresPullThrough: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="text-xs text-stone-200 font-medium">Pull-Through Pad</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.requiresWaterSewer}
                      onChange={(e) => onUpdateFilters({ requiresWaterSewer: e.target.checked })}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="text-xs text-stone-200 font-medium">Full Hookups (Water/Sewer)</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Party & Needs */}
      {activeTab === 'party' && (
        <div className="p-4 space-y-4 text-xs">
          {/* Party size & vehicles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <label className="font-semibold text-stone-300 block mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Number of People
              </label>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onUpdateFilters({ partySize: Math.max(1, filters.partySize - 1) })}
                  className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm"
                >
                  -
                </button>
                <span className="text-base font-bold text-white flex-1 text-center">
                  {filters.partySize}
                </span>
                <button
                  onClick={() => onUpdateFilters({ partySize: Math.min(25, filters.partySize + 1) })}
                  className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
              <label className="font-semibold text-stone-300 block mb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-400" /> Number of Vehicles
              </label>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onUpdateFilters({ vehiclesCount: Math.max(1, filters.vehiclesCount - 1) })}
                  className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm"
                >
                  -
                </button>
                <span className="text-base font-bold text-white flex-1 text-center">
                  {filters.vehiclesCount}
                </span>
                <button
                  onClick={() => onUpdateFilters({ vehiclesCount: Math.min(6, filters.vehiclesCount + 1) })}
                  className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Pets Toggle */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-200 block flex items-center gap-1.5">
                <Dog className="w-4 h-4 text-amber-400" /> Traveling with Pets?
              </span>
              <span className="text-[10px] text-stone-400">
                Filters out sites where pets are not allowed.
              </span>
            </div>
            <button
              onClick={() => onUpdateFilters({ hasPets: !filters.hasPets })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                filters.hasPets ? 'bg-amber-500 justify-end' : 'bg-stone-800 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Accessibility Requirements */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-200 block flex items-center gap-1.5">
                  <Accessibility className="w-4 h-4 text-emerald-400" /> ADA Accessibility Required
                </span>
                <span className="text-[10px] text-stone-400">
                  Prioritizes accessible campsites and flat, barrier-free facilities.
                </span>
              </div>
              <button
                onClick={() => onUpdateFilters({ requiresAda: !filters.requiresAda })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                  filters.requiresAda ? 'bg-emerald-600 justify-end' : 'bg-stone-800 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {filters.requiresAda && (
              <div className="pt-2 border-t border-stone-800/80">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.strictAdaOnly}
                    onChange={(e) => onUpdateFilters({ strictAdaOnly: e.target.checked })}
                    className="accent-emerald-500 mt-0.5 rounded"
                  />
                  <div>
                    <span className="font-medium text-stone-200 text-xs block">
                      Strict Confirmed ADA Only
                    </span>
                    <span className="text-[10px] text-stone-400 block">
                      If unchecked, sites with unspecified accessibility will also be shown as "Unknown (not ruled out)".
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Amenities & Search Corridor */}
      {activeTab === 'amenities' && (
        <div className="p-4 space-y-4 text-xs">
          {/* Corridor distance slider */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-stone-200">Max Campground Detour Distance:</span>
              <span className="font-bold text-emerald-400">{filters.maxCorridorDistanceMiles} miles off-route</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={filters.maxCorridorDistanceMiles}
              onChange={(e) => onUpdateFilters({ maxCorridorDistanceMiles: parseInt(e.target.value) })}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-stone-500 mt-1">
              <span>5 mi (Strictly along route)</span>
              <span>30 mi (Standard)</span>
              <span>60 mi (Wide region)</span>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <span className="font-bold text-stone-300 uppercase tracking-wider text-[11px] block">
              Site Amenities Preferences
            </span>

            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-stone-200">Waterfront / Lake / River</span>
              </div>
              <input
                type="checkbox"
                checked={filters.preferWaterfront}
                onChange={(e) => onUpdateFilters({ preferWaterfront: e.target.checked })}
                className="accent-emerald-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
              <div className="flex items-center gap-2">
                <Trees className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-stone-200">Shaded Site (Natural canopy)</span>
              </div>
              <input
                type="checkbox"
                checked={filters.preferShade}
                onChange={(e) => onUpdateFilters({ preferShade: e.target.checked })}
                className="accent-emerald-500 rounded"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
