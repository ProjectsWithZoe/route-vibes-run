/**
 * Gets the current user position using the Geolocation API
 * @returns Promise with the current position coordinates
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  });
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Vibrate the device
export const vibrateDevice = (pattern?: number | number[]): void => {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern || 200);
  } else {
    console.log("Vibration not supported in this device");
  }
};

// Format distance with appropriate units
export const formatDistance = (distance: number): string => {
  if (distance < 0.1) {
    // Convert to feet if less than 0.1 miles
    const feet = Math.round(distance * 5280);
    return `${feet} ft`;
  } else {
    // Otherwise return miles with 1 decimal place
    return `${distance.toFixed(1)} mi`;
  }
};
