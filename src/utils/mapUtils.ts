
interface Point {
  lat: number;
  lng: number;
}

interface Route {
  id: string;
  points: Point[];
  distance: number;
  description: string;
  color: string;
}

/**
 * Generate a random point at a specific distance from a center point
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param distance Distance in miles
 * @returns New point coordinates
 */
const generatePointAtDistance = (centerLat: number, centerLng: number, distance: number): Point => {
  // Approximate degrees for the given distance
  const milesPerDegree = 69;
  const distanceFraction = distance / milesPerDegree;

  // Random angle
  const angle = Math.random() * 2 * Math.PI;

  // Generate offset position
  const lat = centerLat + Math.cos(angle) * distanceFraction;
  const lng = centerLng + Math.sin(angle) * distanceFraction / Math.cos(centerLat * Math.PI / 180);

  return { lat, lng };
};

/**
 * Generate a route of a specific distance from a starting point
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param targetDistance Target distance in miles
 * @returns Array of points forming a route
 */
const generateRoute = (startLat: number, startLng: number, targetDistance: number): Point[] => {
  const routePoints: Point[] = [{ lat: startLat, lng: startLng }];
  
  // Calculate number of waypoints based on distance
  const numWaypoints = Math.max(3, Math.floor(targetDistance * 3));
  const intervalDistance = targetDistance / numWaypoints;
  
  let currentLat = startLat;
  let currentLng = startLng;

  // Generate waypoints
  for (let i = 0; i < numWaypoints - 1; i++) {
    const point = generatePointAtDistance(currentLat, currentLng, intervalDistance);
    routePoints.push(point);
    currentLat = point.lat;
    currentLng = point.lng;
  }

  // Add the starting point at the end to close the loop
  routePoints.push({ lat: startLat, lng: startLng });
  
  return routePoints;
};

/**
 * Generate multiple route options
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param targetDistance Target distance in miles
 * @param numRoutes Number of routes to generate
 * @returns Array of route objects
 */
export const generateRouteOptions = (
  startLat: number, 
  startLng: number, 
  targetDistance: number, 
  numRoutes: number = 3
): Route[] => {
  const routes: Route[] = [];
  const colors = ['#1EAEDB', '#4CD964', '#9b87f5'];
  const descriptions = [
    "Loop around nearby area",
    "Scenic neighborhood route",
    "Discover new paths"
  ];

  for (let i = 0; i < numRoutes; i++) {
    // Generate slight variations in target distance
    const variationFactor = 0.95 + Math.random() * 0.1; // Between 0.95 and 1.05
    const adjustedDistance = targetDistance * variationFactor;
    
    const routePoints = generateRoute(startLat, startLng, adjustedDistance);
    
    routes.push({
      id: `route-${i}`,
      points: routePoints,
      distance: adjustedDistance,
      description: descriptions[i % descriptions.length],
      color: colors[i % colors.length]
    });
  }
  
  return routes;
};

// Default map style URLs
export const mapStyles = {
  light: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
};

export type { Point, Route };
