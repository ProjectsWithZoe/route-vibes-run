
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
 * Fetch a route using Mapbox Directions API
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param targetDistance Target distance in miles
 * @returns Promise resolving to array of points forming a route
 */
const fetchRouteFromMapbox = async (
  startLat: number, 
  startLng: number, 
  targetDistance: number,
  accessToken: string
): Promise<Point[]> => {
  // Convert target distance from miles to meters
  const targetMeters = targetDistance * 1609.34;
  
  try {
    // Generate a destination point roughly in the target distance direction
    // This is a simplified approach - we'll get a point in a random direction
    // and let Mapbox's API handle the routing along roads
    const angle = Math.random() * 2 * Math.PI;
    const milesPerDegree = 69;
    const distanceFraction = targetDistance * 0.45 / milesPerDegree; // Using less than target distance to allow for road routing
    
    const destLat = startLat + Math.cos(angle) * distanceFraction;
    const destLng = startLng + Math.sin(angle) * distanceFraction / Math.cos(startLat * Math.PI / 180);
    
    // Use Mapbox Directions API to get a route between points
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${startLng},${startLat};${destLng},${destLat}?geometries=geojson&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch route from Mapbox API');
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }
    
    // Extract coordinates from the route
    const coordinates = data.routes[0].geometry.coordinates;
    
    // Convert to our Point format (note: Mapbox returns [lng, lat] format)
    const points = coordinates.map((coord: number[]): Point => ({
      lng: coord[0],
      lat: coord[1]
    }));
    
    // For loop routes, add the starting point at the end
    if (points.length > 0) {
      points.push({ lat: startLat, lng: startLng });
    }
    
    return points;
  } catch (error) {
    console.error('Error fetching Mapbox route:', error);
    
    // Fallback to a simple circular route if API fails
    const routePoints: Point[] = [{ lat: startLat, lng: startLng }];
    const numWaypoints = Math.max(3, Math.floor(targetDistance * 3));
    const angleStep = (2 * Math.PI) / numWaypoints;
    const milesPerDegree = 69;
    const radius = targetDistance / (2 * Math.PI) / milesPerDegree;
    
    for (let i = 0; i < numWaypoints; i++) {
      const angle = i * angleStep;
      const lat = startLat + Math.cos(angle) * radius;
      const lng = startLng + Math.sin(angle) * radius / Math.cos(startLat * Math.PI / 180);
      routePoints.push({ lat, lng });
    }
    
    // Close the loop
    routePoints.push({ lat: startLat, lng: startLng });
    return routePoints;
  }
};

/**
 * Generate multiple route options
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param targetDistance Target distance in miles
 * @param numRoutes Number of routes to generate
 * @returns Promise resolving to array of route objects
 */
export const generateRouteOptions = async (
  startLat: number, 
  startLng: number, 
  targetDistance: number, 
  numRoutes: number = 3
): Promise<Route[]> => {
  const routes: Route[] = [];
  const colors = ['#1EAEDB', '#4CD964', '#9b87f5'];
  const descriptions = [
    "Loop around nearby area",
    "Scenic neighborhood route",
    "Discover new paths"
  ];
  
  // Get the Mapbox token from localStorage
  const mapboxToken = localStorage.getItem('mapbox_token') || 'YOUR_MAPBOX_TOKEN_HERE';
  
  // Generate routes sequentially to avoid overwhelming the API
  for (let i = 0; i < numRoutes; i++) {
    try {
      // Generate slight variations in target distance and direction for each route
      const variationFactor = 0.85 + Math.random() * 0.3; // Between 0.85 and 1.15
      const adjustedDistance = targetDistance * variationFactor;
      
      // Fetch route points using Mapbox Directions API
      const routePoints = await fetchRouteFromMapbox(
        startLat, 
        startLng, 
        adjustedDistance,
        mapboxToken
      );
      
      // Calculate actual route distance
      let actualDistance = 0;
      for (let j = 1; j < routePoints.length; j++) {
        actualDistance += calculateDistance(
          routePoints[j-1].lat, 
          routePoints[j-1].lng,
          routePoints[j].lat,
          routePoints[j].lng
        );
      }
      
      routes.push({
        id: `route-${i}`,
        points: routePoints,
        distance: parseFloat(actualDistance.toFixed(2)),
        description: descriptions[i % descriptions.length],
        color: colors[i % colors.length]
      });
    } catch (error) {
      console.error(`Error generating route ${i}:`, error);
    }
  }
  
  return routes;
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
};

// Convert degrees to radians
const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

// Default map style URLs
export const mapStyles = {
  light: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
};

export type { Point, Route };
