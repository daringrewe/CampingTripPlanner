import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Map,
  useMap,
  useMapsLibrary,
  AdvancedMarker,
  InfoWindow,
  Pin
} from '@vis.gl/react-google-maps';
import { LocationPoint, metersToMiles, formatDuration } from '../utils/geo';
import { Campsite, ParkSummary } from '../data/campsites';
import { MatchEvaluation } from '../utils/campsiteMatcher';
import {
  Navigation,
  Tent,
  Home,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  Maximize2,
  Layers,
  ChevronRight
} from 'lucide-react';

interface RouteLegInfo {
  startName: string;
  endName: string;
  distanceMiles: number;
  durationSeconds: number;
}

interface MapComponentProps {
  home: LocationPoint | null;
  destinations: LocationPoint[];
  isRoundTrip: boolean;
  onUpdateWaypointPosition: (id: string, lat: number, lng: number) => void;
  onMapClickAddStop: (lat: number, lng: number) => void;
  campgroundsAlongRoute: {
    park: ParkSummary;
    distanceFromRoute: number;
    matchingSites: MatchEvaluation[];
  }[];
  onSelectPark: (park: ParkSummary) => void;
  onAddParkAsStop: (park: ParkSummary) => void;
  onRouteCalculated?: (totalMiles: number, totalSeconds: number, legs: RouteLegInfo[]) => void;
}

export function MapComponent({
  home,
  destinations,
  isRoundTrip,
  onUpdateWaypointPosition,
  onMapClickAddStop,
  campgroundsAlongRoute,
  onSelectPark,
  onAddParkAsStop,
  onRouteCalculated,
}: MapComponentProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');

  const [activeInfoPark, setActiveInfoPark] = useState<{
    park: ParkSummary;
    distance: number;
    matchingSites: MatchEvaluation[];
  } | null>(null);

  const [selectedWaypoint, setSelectedWaypoint] = useState<LocationPoint | null>(null);
  const [clickToAddEnabled, setClickToAddEnabled] = useState(false);
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [showCampgroundsLayer, setShowCampgroundsLayer] = useState(true);

  // Polylines references
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Collect ordered waypoints
  const allStops = React.useMemo(() => {
    if (!home) return [];
    const list = [home, ...destinations];
    if (isRoundTrip && destinations.length > 0) {
      list.push({ ...home, id: 'home-return', name: `${home.name} (Return)` });
    }
    return list;
  }, [home, destinations, isRoundTrip]);

  // Compute Route using Google Maps Routes / Directions
  useEffect(() => {
    if (!map || allStops.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    setIsComputingRoute(true);

    const origin = { lat: allStops[0].lat, lng: allStops[0].lng };
    const destination = {
      lat: allStops[allStops.length - 1].lat,
      lng: allStops[allStops.length - 1].lng,
    };
    const intermediates = allStops.slice(1, allStops.length - 1).map((s) => ({
      location: { latLng: { lat: s.lat, lng: s.lng } },
    }));

    // Draw connecting path smoothly
    const drawPath = (pathCoords: google.maps.LatLngLiteral[], totalDistM: number, totalDurS: number, legs: RouteLegInfo[]) => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      const poly = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#10b981', // vibrant emerald
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map,
      });

      polylineRef.current = poly;

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      pathCoords.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

      setIsComputingRoute(false);
      if (onRouteCalculated) {
        onRouteCalculated(metersToMiles(totalDistM), totalDurS, legs);
      }
    };

    // Attempt Modern Routes API via routesLib
    if (routesLib && (routesLib as any).Route) {
      try {
        const routeService = new (routesLib as any).Route();
        const request: any = {
          origin: { latLng: origin },
          destination: { latLng: destination },
          intermediates: intermediates.length > 0 ? intermediates : undefined,
          travelMode: (routesLib as any).TravelMode?.DRIVING || 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
        };

        routeService
          .computeRoutes(request)
          .then((response: any) => {
            if (response.routes && response.routes.length > 0) {
              const primaryRoute = response.routes[0];
              const path: google.maps.LatLngLiteral[] = [];

              if (primaryRoute.polyline && primaryRoute.polyline.encodedPolyline) {
                const decoded = (routesLib as any).Route.decode(primaryRoute.polyline.encodedPolyline);
                decoded.forEach((pt: any) => path.push({ lat: pt.lat(), lng: pt.lng() }));
              } else if (primaryRoute.path) {
                primaryRoute.path.forEach((pt: any) => path.push({ lat: pt.lat(), lng: pt.lng() }));
              }

              // Compute legs info
              const legs: RouteLegInfo[] = (primaryRoute.legs || []).map((leg: any, idx: number) => ({
                startName: allStops[idx]?.name || `Stop ${idx}`,
                endName: allStops[idx + 1]?.name || `Stop ${idx + 1}`,
                distanceMiles: metersToMiles(leg.distanceMeters || 0),
                durationSeconds: Math.round((leg.durationMillis || 0) / 1000),
              }));

              drawPath(
                path.length > 0 ? path : allStops.map((s) => ({ lat: s.lat, lng: s.lng })),
                primaryRoute.distanceMeters || 0,
                Math.round((primaryRoute.durationMillis || 0) / 1000),
                legs
              );
            } else {
              fallbackGeometry();
            }
          })
          .catch((err: any) => {
            console.warn('Routes API compute error, falling back to direct line/directions:', err);
            fallbackGeometry();
          });
      } catch (e) {
        fallbackGeometry();
      }
    } else {
      fallbackGeometry();
    }

    function fallbackGeometry() {
      // Fallback: draw straight geodesics connecting waypoints and calculate approximate drive metrics
      const coords = allStops.map((s) => ({ lat: s.lat, lng: s.lng }));
      let totalMeters = 0;
      const legs: RouteLegInfo[] = [];

      for (let i = 0; i < allStops.length - 1; i++) {
        const p1 = allStops[i];
        const p2 = allStops[i + 1];
        const dMiles = metersToMiles(
          google.maps.geometry
            ? google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(p1.lat, p1.lng),
                new google.maps.LatLng(p2.lat, p2.lng)
              )
            : 0
        ) * 1.25; // add 25% road winding factor

        const durSec = Math.round((dMiles / 55) * 3600); // 55 mph average
        totalMeters += (dMiles / 0.000621371);

        legs.push({
          startName: p1.name,
          endName: p2.name,
          distanceMiles: Math.round(dMiles * 10) / 10,
          durationSeconds: durSec,
        });
      }

      drawPath(coords, totalMeters, Math.round((totalMeters * 0.000621371 / 55) * 3600), legs);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, routesLib, allStops, isRoundTrip]);

  // Handle map click
  const handleMapClick = (e: any) => {
    if (!clickToAddEnabled) return;
    if (e.detail?.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      onMapClickAddStop(lat, lng);
    }
  };

  const fitAllStops = () => {
    if (!map || allStops.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    allStops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950">
      {/* Floating Map Controls */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2">
        <button
          onClick={fitAllStops}
          className="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700/80 text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-md transition"
        >
          <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fit Route</span>
        </button>

        <button
          onClick={() => setShowCampgroundsLayer(!showCampgroundsLayer)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-md transition ${
            showCampgroundsLayer
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-stone-900/90 border-stone-700/80 text-stone-400'
          }`}
        >
          <Tent className="w-3.5 h-3.5" />
          <span>Campgrounds ({campgroundsAlongRoute.length})</span>
        </button>

        <button
          onClick={() => setClickToAddEnabled(!clickToAddEnabled)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-md transition ${
            clickToAddEnabled
              ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
              : 'bg-stone-900/90 border-stone-700/80 text-stone-300'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{clickToAddEnabled ? 'Click Map to Place Stop' : 'Add Stop on Map'}</span>
        </button>

        {isComputingRoute && (
          <span className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-700 text-stone-300 text-xs font-medium flex items-center gap-1.5 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Calculating best path...
          </span>
        )}
      </div>

      {/* Drag instructions hint */}
      <div className="absolute bottom-3 left-3 z-30 bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl px-3 py-1.5 text-[11px] text-stone-300 shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>Drag & drop numbered pins to adjust planned path</span>
      </div>

      <Map
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        defaultCenter={{ lat: 46.5, lng: -94.3 }}
        defaultZoom={7}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleMapClick}
        className="w-full h-full"
      >
        {/* Origin / Home Marker */}
        {home && (
          <AdvancedMarker
            position={{ lat: home.lat, lng: home.lng }}
            gmpDraggable={true}
            onDragEnd={(e) => {
              if (e.latLng) {
                onUpdateWaypointPosition('home', e.latLng.lat(), e.latLng.lng());
              }
            }}
            onClick={() => setSelectedWaypoint(home)}
            title="Starting Point (Home)"
          >
            <div className="flex flex-col items-center group cursor-grab active:cursor-grabbing">
              <div className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] shadow-md border border-emerald-400 whitespace-nowrap mb-1">
                HOME
              </div>
              <Pin
                background="#059669"
                borderColor="#047857"
                glyphColor="#ffffff"
                scale={1.2}
              />
            </div>
          </AdvancedMarker>
        )}

        {/* Destination Markers (Numbered & Draggable) */}
        {destinations.map((dest, idx) => (
          <AdvancedMarker
            key={dest.id}
            position={{ lat: dest.lat, lng: dest.lng }}
            gmpDraggable={true}
            onDragEnd={(e) => {
              if (e.latLng) {
                onUpdateWaypointPosition(dest.id, e.latLng.lat(), e.latLng.lng());
              }
            }}
            onClick={() => setSelectedWaypoint(dest)}
            title={`Stop ${idx + 1}: ${dest.name}`}
          >
            <div className="flex flex-col items-center group cursor-grab active:cursor-grabbing">
              <div className="px-2 py-0.5 rounded-md bg-stone-900/90 text-amber-300 font-bold text-[10px] shadow-md border border-amber-500/50 whitespace-nowrap mb-1 max-w-[120px] truncate">
                {idx + 1}. {dest.name}
              </div>
              <Pin
                background="#f59e0b"
                borderColor="#b45309"
                glyphColor="#1c1917"
                scale={1.15}
              />
            </div>
          </AdvancedMarker>
        ))}

        {/* Campgrounds Layer along the route */}
        {showCampgroundsLayer &&
          campgroundsAlongRoute.map(({ park, distanceFromRoute, matchingSites }) => {
            const hasPerfectMatch = matchingSites.some((s) => s.status === 'perfect');
            const hasGoodMatch = matchingSites.some((s) => s.status === 'good');
            const pinColor = hasPerfectMatch ? '#10b981' : hasGoodMatch ? '#38bdf8' : '#a8a29e';

            return (
              <AdvancedMarker
                key={park.name}
                position={{ lat: park.lat, lng: park.lng }}
                onClick={() =>
                  setActiveInfoPark({
                    park,
                    distance: distanceFromRoute,
                    matchingSites,
                  })
                }
                title={`${park.name} (${Math.round(distanceFromRoute * 10) / 10} mi from route)`}
              >
                <div className="p-1 rounded-full bg-stone-900/90 border border-stone-700 shadow-md hover:scale-110 transition cursor-pointer">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: pinColor }}
                  >
                    <Tent className="w-3 h-3 text-stone-950" />
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

        {/* Campground InfoWindow Popup */}
        {activeInfoPark && (
          <InfoWindow
            position={{ lat: activeInfoPark.park.lat, lng: activeInfoPark.park.lng }}
            onCloseClick={() => setActiveInfoPark(null)}
          >
            <div className="text-stone-900 p-2 max-w-[280px]">
              <div className="flex items-start justify-between gap-1 mb-1">
                <div>
                  <h4 className="font-bold text-sm leading-tight text-stone-950">
                    {activeInfoPark.park.name}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {activeInfoPark.park.county} County • {activeInfoPark.park.tourismRegion} MN
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                  {Math.round(activeInfoPark.distance * 10) / 10} mi detour
                </span>
              </div>

              <div className="my-2 p-2 bg-stone-100 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-600">Matching Sites:</span>
                  <span className="font-bold text-emerald-700">
                    {activeInfoPark.matchingSites.length} of {activeInfoPark.park.siteCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Max RV Pad:</span>
                  <span className="font-bold text-stone-800">{activeInfoPark.park.maxPadLength || 'N/A'} ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">ADA Accessible:</span>
                  <span className="font-bold text-stone-800">
                    {activeInfoPark.park.adaCount > 0 ? `${activeInfoPark.park.adaCount} confirmed` : 'Unknown / Check sites'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => {
                    onAddParkAsStop(activeInfoPark.park);
                    setActiveInfoPark(null);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add as Stop
                </button>
                <button
                  onClick={() => {
                    onSelectPark(activeInfoPark.park);
                    setActiveInfoPark(null);
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs transition"
                >
                  View Sites
                </button>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Selected Waypoint InfoWindow */}
        {selectedWaypoint && (
          <InfoWindow
            position={{ lat: selectedWaypoint.lat, lng: selectedWaypoint.lng }}
            onCloseClick={() => setSelectedWaypoint(null)}
          >
            <div className="text-stone-900 p-2 max-w-[220px]">
              <span className="font-bold text-sm block mb-1">{selectedWaypoint.name}</span>
              <p className="text-xs text-stone-600 mb-2">
                Tip: Drag this pin directly on the map to change the stop location!
              </p>
              <div className="text-[11px] text-stone-500 font-mono">
                {selectedWaypoint.lat.toFixed(4)}, {selectedWaypoint.lng.toFixed(4)}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
