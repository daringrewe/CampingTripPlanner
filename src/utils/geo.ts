// Geospatial and Route Optimization Utilities
import { Campsite, ParkSummary } from '../data/campsites';

export interface LocationPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isHome?: boolean;
  isCampground?: boolean;
  notes?: string;
  campgroundData?: {
    park: string;
    matchingSitesCount: number;
  };
}

// Haversine distance in miles between two coordinates
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Shortest distance from a point to a line segment (in miles)
export function distanceToSegment(
  pLat: number,
  pLng: number,
  vLat: number,
  vLng: number,
  wLat: number,
  wLng: number
): number {
  const l2 = (wLat - vLat) ** 2 + (wLng - vLng) ** 2;
  if (l2 === 0) return getDistanceMiles(pLat, pLng, vLat, vLng);
  // Consider the line extending the segment, parameterized as v + t (w - v).
  // We find projection of point p onto the line.
  // It falls where t = [(p-v) . (w-v)] / |w-v|^2
  let t = ((pLat - vLat) * (wLat - vLat) + (pLng - vLng) * (wLng - vLng)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projLat = vLat + t * (wLat - vLat);
  const projLng = vLng + t * (wLng - vLng);
  return getDistanceMiles(pLat, pLng, projLat, projLng);
}

// Distance from a point to a polyline route (in miles)
export function distanceToRoute(point: { lat: number; lng: number }, routePoints: { lat: number; lng: number }[]): number {
  if (routePoints.length === 0) return Infinity;
  if (routePoints.length === 1) return getDistanceMiles(point.lat, point.lng, routePoints[0].lat, routePoints[0].lng);

  let minDistance = Infinity;
  // Step in segments
  for (let i = 0; i < routePoints.length - 1; i++) {
    const d = distanceToSegment(
      point.lat,
      point.lng,
      routePoints[i].lat,
      routePoints[i].lng,
      routePoints[i + 1].lat,
      routePoints[i + 1].lng
    );
    if (d < minDistance) {
      minDistance = d;
      // If within 0.2 miles, close enough
      if (minDistance < 0.2) break;
    }
  }
  return minDistance;
}

// TSP Solver to order intermediate waypoints between Start (Home) and End
// Uses greedy nearest neighbor + 2-opt optimization
export function optimizeRouteOrder(
  home: LocationPoint,
  destinations: LocationPoint[],
  roundTrip: boolean = true
): { orderedPoints: LocationPoint[]; savedMilesEstimate: number } {
  if (destinations.length <= 1) {
    return {
      orderedPoints: [home, ...destinations],
      savedMilesEstimate: 0,
    };
  }

  // Calculate original tour distance
  const originalTour = [home, ...destinations];
  let originalDistance = 0;
  for (let i = 0; i < originalTour.length - 1; i++) {
    originalDistance += getDistanceMiles(
      originalTour[i].lat,
      originalTour[i].lng,
      originalTour[i + 1].lat,
      originalTour[i + 1].lng
    );
  }
  if (roundTrip) {
    originalDistance += getDistanceMiles(
      originalTour[originalTour.length - 1].lat,
      originalTour[originalTour.length - 1].lng,
      home.lat,
      home.lng
    );
  }

  // Greedy Nearest Neighbor from Home
  const unvisited = [...destinations];
  const ordered: LocationPoint[] = [home];
  let current = home;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const dist = getDistanceMiles(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }
    current = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }

  // 2-opt local search optimization on destinations
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < ordered.length - 1; i++) {
      for (let k = i + 1; k < ordered.length; k++) {
        const pA = ordered[i - 1];
        const pB = ordered[i];
        const pC = ordered[k];
        const pD = k + 1 < ordered.length ? ordered[k + 1] : roundTrip ? home : null;

        const currentDist =
          getDistanceMiles(pA.lat, pA.lng, pB.lat, pB.lng) +
          (pD ? getDistanceMiles(pC.lat, pC.lng, pD.lat, pD.lng) : 0);

        const newDist =
          getDistanceMiles(pA.lat, pA.lng, pC.lat, pC.lng) +
          (pD ? getDistanceMiles(pB.lat, pB.lng, pD.lat, pD.lng) : 0);

        if (newDist < currentDist - 0.05) {
          // Reverse segment between i and k
          const sub = ordered.slice(i, k + 1).reverse();
          ordered.splice(i, k - i + 1, ...sub);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  // Calculate new distance
  let newDistance = 0;
  for (let i = 0; i < ordered.length - 1; i++) {
    newDistance += getDistanceMiles(
      ordered[i].lat,
      ordered[i].lng,
      ordered[i + 1].lat,
      ordered[i + 1].lng
    );
  }
  if (roundTrip) {
    newDistance += getDistanceMiles(
      ordered[ordered.length - 1].lat,
      ordered[ordered.length - 1].lng,
      home.lat,
      home.lng
    );
  }

  const saved = Math.max(0, originalDistance - newDistance);

  return {
    orderedPoints: ordered,
    savedMilesEstimate: Math.round(saved * 10) / 10,
  };
}

// Convert driving duration seconds to formatted string
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

// Convert meters to miles
export function metersToMiles(meters: number): number {
  return Math.round((meters * 0.000621371) * 10) / 10;
}
