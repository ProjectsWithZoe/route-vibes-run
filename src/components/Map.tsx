
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { mapStyles, type Point, type Route } from '@/utils/mapUtils';
import { calculateDistance } from '@/utils/locationUtils';
import LoadingSpinner from './LoadingSpinner';

// This will be replaced with the MapBox token from the environment variables
// For now, it's a placeholder that users need to replace with their token
const MAPBOX_TOKEN = 'YOUR_MAPBOX_TOKEN_HERE';

interface MapProps {
  routes?: Route[];
  activeRouteId?: string;
  isTracking: boolean;
  onLocationUpdate?: (lat: number, lng: number, distance: number) => void;
}

const Map: React.FC<MapProps> = ({ 
  routes = [], 
  activeRouteId,
  isTracking,
  onLocationUpdate 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const routeSources = useRef<string[]>([]);
  const watchId = useRef<number | null>(null);
  const lastPosition = useRef<Point | null>(null);
  const accumulatedDistance = useRef<number>(0);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapToken, setMapToken] = useState<string>(MAPBOX_TOKEN);
  
  // Handle token input if the placeholder token is used
  const handleTokenInput = () => {
    const token = prompt(
      "Please enter your Mapbox access token. You can get one by signing up at https://mapbox.com"
    );
    
    if (token) {
      setMapToken(token);
      localStorage.setItem('mapbox_token', token);
    }
  };
  
  // Load token from localStorage if available
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapToken(savedToken);
    } else if (mapToken === 'YOUR_MAPBOX_TOKEN_HERE') {
      handleTokenInput();
    }
  }, []);
  
  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || mapToken === 'YOUR_MAPBOX_TOKEN_HERE') return;
    
    mapboxgl.accessToken = mapToken;
    
    const initializeMap = async () => {
      try {
        // Get current position
        const position = await getCurrentPositionPromise();
        
        // Create the map
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: mapStyles.light,
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 15,
          attributionControl: false
        });
        
        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );
        
        // Add geolocation control
        map.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: false
          }),
          'top-right'
        );

        // Create a marker for the user's position
        userMarker.current = new mapboxgl.Marker({
          color: '#1EAEDB',
          scale: 0.8
        })
          .setLngLat([position.coords.longitude, position.coords.latitude])
          .addTo(map.current);
          
        lastPosition.current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.current.on('load', () => {
          setMapLoaded(true);
          setLoading(false);
        });
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
      }
    };
    
    initializeMap();
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [mapToken]);
  
  // Draw routes on the map
  useEffect(() => {
    if (!map.current || !mapLoaded || routes.length === 0) return;
    
    // Remove previous routes
    routeSources.current.forEach(id => {
      if (map.current?.getLayer(id)) map.current.removeLayer(id);
      if (map.current?.getSource(id)) map.current.removeSource(id);
    });
    
    routeSources.current = [];
    
    // Add new routes
    routes.forEach(route => {
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;
      
      // Convert points to GeoJSON
      const coordinates = route.points.map(point => [point.lng, point.lat]);
      
      // Add source and layer
      map.current?.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
      });
      
      map.current?.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': route.color,
          'line-width': route.id === activeRouteId ? 5 : 3,
          'line-opacity': route.id === activeRouteId ? 0.8 : 0.6
        }
      });
      
      routeSources.current.push(sourceId);
      routeSources.current.push(layerId);
    });
  }, [routes, activeRouteId, mapLoaded]);
  
  // Update active route styling
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    routes.forEach(route => {
      const layerId = `route-layer-${route.id}`;
      if (map.current?.getLayer(layerId)) {
        map.current.setPaintProperty(
          layerId,
          'line-width',
          route.id === activeRouteId ? 5 : 3
        );
        
        map.current.setPaintProperty(
          layerId,
          'line-opacity',
          route.id === activeRouteId ? 0.8 : 0.6
        );
      }
    });
  }, [activeRouteId, routes, mapLoaded]);
  
  // Handle location tracking
  useEffect(() => {
    if (!map.current || !isTracking) {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    
    // Reset accumulated distance when starting tracking
    accumulatedDistance.current = 0;
    
    // Start watching position
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update marker position
        if (userMarker.current) {
          userMarker.current.setLngLat([longitude, latitude]);
        }
        
        // Move map to follow user
        if (map.current) {
          map.current.easeTo({
            center: [longitude, latitude],
            duration: 500
          });
        }
        
        // Calculate distance traveled since last position
        if (lastPosition.current) {
          const segmentDistance = calculateDistance(
            lastPosition.current.lat,
            lastPosition.current.lng,
            latitude,
            longitude
          );
          
          // Only add distance if it's reasonable (to filter out GPS jumps)
          if (segmentDistance < 0.1) {  // Less than 0.1 miles
            accumulatedDistance.current += segmentDistance;
            
            // Call the callback with updated distance
            if (onLocationUpdate) {
              onLocationUpdate(latitude, longitude, accumulatedDistance.current);
            }
          }
        }
        
        // Update last position
        lastPosition.current = { lat: latitude, lng: longitude };
      },
      (error) => {
        console.error('Error getting location: ', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isTracking, onLocationUpdate]);
  
  // Helper function to promisify getCurrentPosition
  const getCurrentPositionPromise = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  };

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-20">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-3 text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {mapToken === 'YOUR_MAPBOX_TOKEN_HERE' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
          <div className="text-center p-4 max-w-xs">
            <h3 className="text-lg font-medium mb-2">MapBox Token Required</h3>
            <p className="mb-4 text-sm text-gray-600">
              This app requires a MapBox access token to display maps.
            </p>
            <button 
              onClick={handleTokenInput}
              className="px-4 py-2 bg-route-blue text-white rounded-md hover:bg-route-blue/90"
            >
              Enter Token
            </button>
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default Map;
