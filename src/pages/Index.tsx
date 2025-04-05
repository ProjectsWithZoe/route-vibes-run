
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Map from '@/components/Map';
import DistanceInput from '@/components/DistanceInput';
import RouteCard from '@/components/RouteCard';
import RunningStats from '@/components/RunningStats';
import { getCurrentPosition, vibrateDevice } from '@/utils/locationUtils';
import { generateRouteOptions, type Route } from '@/utils/mapUtils';
import { Button } from '@/components/ui/button';
import { Navigation, ArrowDown, ArrowUp } from 'lucide-react';

const Index = () => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  // Running mode states
  const [isRunningMode, setIsRunningMode] = useState(false);
  const [targetDistance, setTargetDistance] = useState<number>(0);
  const [currentDistance, setCurrentDistance] = useState<number>(0);
  const [runningDuration, setRunningDuration] = useState<number>(0);
  const [hasReachedTarget, setHasReachedTarget] = useState<boolean>(false);
  
  const timerRef = useRef<number | null>(null);

  // Get user's current location on component mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } catch (error) {
        console.error("Error getting location: ", error);
        toast.error("Failed to get your location. Please check location permissions.");
      }
    };
    
    fetchLocation();
  }, []);
  
  // Handle distance submission (either for route finding or target setting)
  const handleDistanceSubmit = (distance: number, isTargetDistance: boolean) => {
    if (!currentLocation) {
      toast.error("Location not available. Please enable location services.");
      return;
    }
    
    if (isTargetDistance) {
      // Target distance mode
      setTargetDistance(distance);
      setCurrentDistance(0);
      setRunningDuration(0);
      setIsRunningMode(true);
      setShowRoutePanel(false);
      setHasReachedTarget(false);
      
      // Start timer
      startTimer();
      
      toast.success(`Started tracking run with ${distance} mile target`);
    } else {
      // Route finding mode
      setIsLoading(true);
      
      // Generate routes
      try {
        const generatedRoutes = generateRouteOptions(
          currentLocation.lat,
          currentLocation.lng,
          distance
        );
        
        setRoutes(generatedRoutes);
        if (generatedRoutes.length > 0) {
          setActiveRouteId(generatedRoutes[0].id);
        }
        
        setIsRunningMode(false);
        setShowRoutePanel(true);
        setIsPanelCollapsed(false);
      } catch (error) {
        console.error("Error generating routes: ", error);
        toast.error("Failed to generate routes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Handle location updates when tracking a run
  const handleLocationUpdate = (lat: number, lng: number, distance: number) => {
    setCurrentDistance(distance);
    
    // Check if target distance is reached
    if (!hasReachedTarget && distance >= targetDistance) {
      setHasReachedTarget(true);
      
      // Notify user with vibration
      vibrateDevice([200, 100, 200, 100, 200]);
      
      toast.success(`🎉 Target distance of ${targetDistance} miles reached!`);
    }
  };
  
  // Start timer for run tracking
  const startTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    timerRef.current = window.setInterval(() => {
      setRunningDuration(prev => prev + 1);
    }, 1000);
  };
  
  // Handle ending a run
  const handleStopRun = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRunningMode(false);
    setShowRoutePanel(true);
    setIsPanelCollapsed(false);
    
    toast.info(`Run completed: ${currentDistance.toFixed(2)} miles in ${formatRunTime(runningDuration)}`);
  };
  
  // Format run time
  const formatRunTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  // Toggle panel collapse state
  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };
  
  // Handle route selection
  const handleRouteSelect = (routeId: string) => {
    setActiveRouteId(routeId);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="RouteRunner" />
      
      <div className="relative flex-grow">
        <Map 
          routes={routes}
          activeRouteId={activeRouteId}
          isTracking={isRunningMode}
          onLocationUpdate={handleLocationUpdate}
        />
        
        {/* Bottom card container */}
        <div className={`absolute inset-x-0 bottom-0 bottom-card-container ${isPanelCollapsed ? 'hidden-container' : ''}`}>
          {/* Toggle button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={togglePanel}
              className="rounded-t-md rounded-b-none border-b-0 bg-white shadow-md"
            >
              {isPanelCollapsed ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="overflow-y-auto max-h-[90vh]">
            {isRunningMode ? (
              <RunningStats
                distance={currentDistance}
                targetDistance={targetDistance}
                duration={runningDuration}
                isRunning={isRunningMode}
                onStopRun={handleStopRun}
              />
            ) : (
              <>
                <DistanceInput 
                  onDistanceSubmit={handleDistanceSubmit}
                  isLoading={isLoading}
                />
                
                {showRoutePanel && routes.length > 0 && (
                  <div className="bg-gray-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-gray-700">Route Options</h3>
                      <span className="text-xs text-gray-500">{routes.length} routes</span>
                    </div>
                    <div>
                      {routes.map(route => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          isActive={activeRouteId === route.id}
                          onClick={() => handleRouteSelect(route.id)}
                        />
                      ))}
                    </div>
                    
                    {activeRouteId && (
                      <Button
                        onClick={() => {
                          const selectedRoute = routes.find(route => route.id === activeRouteId);
                          if (selectedRoute) {
                            setTargetDistance(selectedRoute.distance);
                            setCurrentDistance(0);
                            setRunningDuration(0);
                            setIsRunningMode(true);
                            setShowRoutePanel(false);
                            setHasReachedTarget(false);
                            startTimer();
                            toast.success(`Started following the selected route`);
                          }
                        }}
                        className="w-full bg-route-green hover:bg-route-green/90 flex items-center justify-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        <span>Start Selected Route</span>
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
