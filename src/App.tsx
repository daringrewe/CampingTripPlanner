import React, { useState, useMemo, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Header } from './components/Header';
import { TripReadinessPrompt } from './components/TripReadinessPrompt';
import { TripForm } from './components/TripForm';
import { MapComponent } from './components/MapComponent';
import { CampgroundList } from './components/CampgroundList';
import { ItinerarySummary } from './components/ItinerarySummary';
import { QuotaBanner } from './components/QuotaBanner';
import {
  LocationPoint,
  optimizeRouteOrder,
  distanceToRoute,
  getDistanceMiles
} from './utils/geo';
import {
  TripFilters,
  CampingStyle,
  evaluateCampsite,
  MatchEvaluation
} from './utils/campsiteMatcher';
import {
  CAMPSITES,
  PARK_SUMMARIES,
  ParkSummary,
  Campsite
} from './data/campsites';
import {
  MapPin,
  Tent,
  Navigation,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAJ_TWzstz1eX5Mc6I0yiYNsMW3xykKbjg';

export default function App() {
  // 1. Core Trip State
  const [home, setHome] = useState<LocationPoint | null>({
    id: 'home',
    name: 'Minneapolis, MN (Home)',
    lat: 44.9778,
    lng: -93.265,
    isHome: true,
  });

  const [destinations, setDestinations] = useState<LocationPoint[]>([
    {
      id: 'dest-1',
      name: 'Gooseberry Falls State Park',
      lat: 47.1426,
      lng: -91.465,
    },
    {
      id: 'dest-2',
      name: 'Split Rock Lighthouse State Park',
      lat: 47.1957,
      lng: -91.3786,
    },
    {
      id: 'dest-3',
      name: 'Itasca State Park (Headwaters)',
      lat: 47.236,
      lng: -95.207,
    },
  ]);

  const [isRoundTrip, setIsRoundTrip] = useState(true);

  // 2. Filters & Preferences
  const [filters, setFilters] = useState<TripFilters>({
    campingStyle: 'rv',
    rvLengthFt: 30,
    requiresElectric30: true,
    requiresElectric50: false,
    requiresPullThrough: false,
    requiresWaterSewer: false,
    partySize: 2,
    vehiclesCount: 1,
    hasPets: true,
    requiresAda: false,
    strictAdaOnly: false,
    preferWaterfront: false,
    preferShade: false,
    maxCorridorDistanceMiles: 30,
  });

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<'route' | 'gear' | 'party' | 'amenities'>('route');
  const [isReadinessExpanded, setIsReadinessExpanded] = useState(false);
  const [selectedPark, setSelectedPark] = useState<ParkSummary | null>(null);

  // Route metrics from MapComponent
  const [routeStats, setRouteStats] = useState<{
    totalMiles: number;
    totalSeconds: number;
    legs: {
      startName: string;
      endName: string;
      distanceMiles: number;
      durationSeconds: number;
    }[];
  }>({
    totalMiles: 0,
    totalSeconds: 0,
    legs: [],
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Update a single filter field
  const handleUpdateFilters = useCallback((patch: Partial<TripFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  // Set home location
  const handleSetHome = (point: LocationPoint) => {
    setHome(point);
    showToast(`Home starting location updated: ${point.name}`);
  };

  // Add destination
  const handleAddDestination = (point: LocationPoint) => {
    setDestinations((prev) => [...prev, point]);
    showToast(`Added stop: ${point.name}`);
  };

  // Remove destination
  const handleRemoveDestination = (id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  // Reorder destinations
  const handleReorderDestinations = (newDestinations: LocationPoint[]) => {
    setDestinations(newDestinations);
  };

  // Drag-and-drop waypoint position update on the map
  const handleUpdateWaypointPosition = (id: string, lat: number, lng: number) => {
    if (id === 'home' && home) {
      setHome({
        ...home,
        lat,
        lng,
        name: `Custom Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      });
      showToast('Starting location moved');
    } else {
      setDestinations((prev) =>
        prev.map((dest) => {
          if (dest.id === id) {
            return {
              ...dest,
              lat,
              lng,
              name: `${dest.name} (Adjusted)`,
            };
          }
          return dest;
        })
      );
      showToast('Route waypoint adjusted');
    }
  };

  // Click on map to add stop
  const handleMapClickAddStop = (lat: number, lng: number) => {
    const newStop: LocationPoint = {
      id: `custom-stop-${Date.now()}`,
      name: `Waystop ${destinations.length + 1} (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      lat,
      lng,
    };
    handleAddDestination(newStop);
  };

  // Optimize route order
  const handleOptimizeOrder = () => {
    if (!home || destinations.length < 2) return;
    const result = optimizeRouteOrder(home, destinations, isRoundTrip);
    // Remove home from the returned list to update destinations
    const newDestinations = result.orderedPoints.slice(1);
    setDestinations(newDestinations);
    if (result.savedMilesEstimate > 0) {
      showToast(`✨ Route optimized! Saved ~${result.savedMilesEstimate} miles for faster travel time.`);
    } else {
      showToast('Route order is already the most efficient!');
    }
  };

  // Add a campground as an overnight stop on the route
  const handleAddParkAsStop = (park: ParkSummary) => {
    const isAlreadyStop = destinations.some((d) => d.name.includes(park.name));
    if (isAlreadyStop) {
      showToast(`${park.name} is already in your route!`);
      return;
    }
    const newStop: LocationPoint = {
      id: `park-stop-${Date.now()}`,
      name: park.name,
      lat: park.lat,
      lng: park.lng,
      isCampground: true,
    };
    handleAddDestination(newStop);
    showToast(`Added ${park.name} as an overnight stop on your itinerary!`);
  };

  // Load a preset road trip
  const handleSelectPreset = (preset: {
    home: LocationPoint;
    destinations: LocationPoint[];
    filters: Partial<TripFilters>;
  }) => {
    setHome(preset.home);
    setDestinations(preset.destinations);
    setFilters((prev) => ({ ...prev, ...preset.filters }));
    showToast(`Loaded "${preset.home.name.split(',')[0]} Tour" preset!`);
  };

  // Reset trip
  const handleReset = () => {
    setHome(null);
    setDestinations([]);
    showToast('Started a fresh trip. Enter your starting city and places to visit.');
  };

  // 3. Find Campgrounds along the route corridor
  const campgroundsAlongRoute = useMemo(() => {
    // Collect all points on the route
    const routePoints: { lat: number; lng: number }[] = [];
    if (home) routePoints.push({ lat: home.lat, lng: home.lng });
    destinations.forEach((d) => routePoints.push({ lat: d.lat, lng: d.lng }));
    if (isRoundTrip && home && destinations.length > 0) {
      routePoints.push({ lat: home.lat, lng: home.lng });
    }

    if (routePoints.length === 0) return [];

    // Calculate distance from each park to the route
    const results: {
      park: ParkSummary;
      distanceFromRoute: number;
      matchingSites: MatchEvaluation[];
    }[] = [];

    PARK_SUMMARIES.forEach((park) => {
      const distance = distanceToRoute({ lat: park.lat, lng: park.lng }, routePoints);

      if (distance <= filters.maxCorridorDistanceMiles) {
        // Find individual matching campsites in this park
        const parkCampsites = CAMPSITES.filter((c) => c.park === park.name);
        const evaluations = parkCampsites
          .map((site) => evaluateCampsite(site, filters))
          .filter((ev) => ev.isEligible);

        // Sort by score
        evaluations.sort((a, b) => b.score - a.score);

        if (evaluations.length > 0) {
          results.push({
            park,
            distanceFromRoute: distance,
            matchingSites: evaluations,
          });
        }
      }
    });

    // Sort parks by detour distance (closest to route first)
    results.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);

    return results;
  }, [home, destinations, isRoundTrip, filters]);

  // Trip readiness calculation
  const missingItemsCount = useMemo(() => {
    let count = 0;
    if (!home) count++;
    if (destinations.length === 0) count++;
    if (!filters.campingStyle) count++;
    if (filters.partySize <= 0) count++;
    return count;
  }, [home, destinations, filters]);

  const isTripComplete = missingItemsCount === 0;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['routes', 'geometry']}>
      <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100">
        {/* Quota Defense Banner (Case A Demo Key) */}
        <QuotaBanner />

        {/* Global Navigation Header */}
        <Header
          onSelectPreset={handleSelectPreset}
          onReset={handleReset}
          totalStops={destinations.length}
          isTripComplete={isTripComplete}
          missingItemsCount={missingItemsCount}
          onOpenPrompt={() => setIsReadinessExpanded(true)}
        />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 right-4 z-50 bg-stone-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Application Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4">
          {/* Missing info prompt */}
          <TripReadinessPrompt
            home={home}
            destinations={destinations}
            filters={filters}
            onSetHome={(name, lat, lng) =>
              handleSetHome({ id: 'home', name, lat, lng, isHome: true })
            }
            onSelectCategoryTab={setActiveTab}
            onQuickAddDestination={(name, lat, lng) =>
              handleAddDestination({ id: `dest-${Date.now()}`, name, lat, lng })
            }
            onUpdateFilters={handleUpdateFilters}
            isExpanded={isReadinessExpanded}
            onToggleExpanded={() => setIsReadinessExpanded(!isReadinessExpanded)}
          />

          {/* Two-Column Responsive Layout: Map + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Trip Planner Form & Itinerary */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <TripForm
                home={home}
                onSetHome={handleSetHome}
                destinations={destinations}
                onAddDestination={handleAddDestination}
                onRemoveDestination={handleRemoveDestination}
                onReorderDestinations={handleReorderDestinations}
                onOptimizeOrder={handleOptimizeOrder}
                isRoundTrip={isRoundTrip}
                onToggleRoundTrip={() => setIsRoundTrip(!isRoundTrip)}
                filters={filters}
                onUpdateFilters={handleUpdateFilters}
                activeTab={activeTab}
                onChangeActiveTab={setActiveTab}
              />

              {/* Itinerary & Driving Leg Stats */}
              <ItinerarySummary
                home={home}
                destinations={destinations}
                isRoundTrip={isRoundTrip}
                totalMiles={routeStats.totalMiles}
                totalDurationSeconds={routeStats.totalSeconds}
                legs={routeStats.legs}
              />
            </div>

            {/* Right Column: Google Map + Campground Corridor List */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Interactive Google Map with drag and drop */}
              <div className="h-[460px] md:h-[520px] w-full">
                <MapComponent
                  home={home}
                  destinations={destinations}
                  isRoundTrip={isRoundTrip}
                  onUpdateWaypointPosition={handleUpdateWaypointPosition}
                  onMapClickAddStop={handleMapClickAddStop}
                  campgroundsAlongRoute={campgroundsAlongRoute}
                  onSelectPark={setSelectedPark}
                  onAddParkAsStop={handleAddParkAsStop}
                  onRouteCalculated={(miles, seconds, legs) =>
                    setRouteStats({ totalMiles: miles, totalSeconds: seconds, legs })
                  }
                />
              </div>

              {/* Campgrounds List along the corridor */}
              <CampgroundList
                campgrounds={campgroundsAlongRoute}
                filters={filters}
                onAddAsStop={handleAddParkAsStop}
                selectedPark={selectedPark}
                onSelectPark={setSelectedPark}
                destinations={destinations}
              />
            </div>
          </div>
        </main>
      </div>
    </APIProvider>
  );
}
