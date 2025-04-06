
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
  accessToken: string,
  directionBias: number = Math.random() * 2 * Math.PI // Add direction bias parameter
): Promise<Point[]> => {
  // Convert target distance from miles to meters
  const targetMeters = targetDistance * 1609.34;
  
  try {
    // Generate a destination point in the biased direction
    // This will help create different route options
    const milesPerDegree = 69;
    const distanceFraction = targetDistance * 0.45 / milesPerDegree; // Using less than target distance to allow for road routing
    
    const destLat = startLat + Math.cos(directionBias) * distanceFraction;
    const destLng = startLng + Math.sin(directionBias) * distanceFraction / Math.cos(startLat * Math.PI / 180);
    
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
    
    // For loop routes, we need to add a return path
    // Let's create a complete loop by requesting a route back to the start
    const returnResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${points[points.length-1].lng},${points[points.length-1].lat};${startLng},${startLat}?geometries=geojson&access_token=${accessToken}`
    );
    
    if (returnResponse.ok) {
      const returnData = await returnResponse.json();
      
      if (returnData.routes && returnData.routes.length > 0) {
        // Skip the first point as it's the same as our last point
        const returnCoordinates = returnData.routes[0].geometry.coordinates.slice(1);
        
        // Add return path points
        const returnPoints = returnCoordinates.map((coord: number[]): Point => ({
          lng: coord[0],
          lat: coord[1]
        }));
        
        points.push(...returnPoints);
      }
    }
    
    return points;
  } catch (error) {
    console.error('Error fetching Mapbox route:', error);
    
    // Improved fallback: Try to get routes in different directions
    // We'll try to get a route in another direction instead of a simple circular path
    try {
      // Try a different direction (90 degrees rotated)
      const newDirection = directionBias + Math.PI / 2;
      return await fetchRouteFromMapbox(startLat, startLng, targetDistance, accessToken, newDirection);
    } catch (secondError) {
      console.error('Secondary route attempt failed:', secondError);
      
      // Last resort: try with a shorter distance
      if (targetDistance > 0.5) {
        try {
          console.log('Attempting with shorter distance');
          return await fetchRouteFromMapbox(startLat, startLng, targetDistance * 0.7, accessToken, directionBias + Math.PI);
        } catch (thirdError) {
          console.error('All route attempts failed:', thirdError);
          // Final fallback - return just the start point to avoid errors
          return [{ lat: startLat, lng: startLng }];
        }
      } else {
        // Final fallback - return just the start point to avoid errors
        return [{ lat: startLat, lng: startLng }];
      }
    }
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
  
  // Generate routes with different directional biases for variety
  const angleStep = (2 * Math.PI) / numRoutes;
  
  // Generate routes sequentially to avoid overwhelming the API
  for (let i = 0; i < numRoutes; i++) {
    try {
      // Generate slight variations in target distance for each route
      const variationFactor = 0.85 + Math.random() * 0.3; // Between 0.85 and 1.15
      const adjustedDistance = targetDistance * variationFactor;
      
      // Use directional bias for varied routes
      const directionBias = i * angleStep;
      
      // Fetch route points using Mapbox Directions API
      const routePoints = await fetchRouteFromMapbox(
        startLat, 
        startLng, 
        adjustedDistance,
        mapboxToken,
        directionBias
      );
      
      // Only add route if it has at least 3 points
      if (routePoints.length > 2) {
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
      }
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
