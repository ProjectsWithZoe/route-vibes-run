
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Clock, Navigation } from 'lucide-react';

interface DistanceInputProps {
  onDistanceSubmit: (distance: number, isTargetDistance: boolean) => void;
  isLoading: boolean;
}

const DistanceInput: React.FC<DistanceInputProps> = ({ onDistanceSubmit, isLoading }) => {
  const [distance, setDistance] = useState<number>(1.0);
  const [isTargetMode, setIsTargetMode] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDistance(Math.min(Math.max(value, 0.1), 10));
    }
  };

  const handleSliderChange = (value: number[]) => {
    setDistance(value[0]);
  };

  const handleSubmit = () => {
    onDistanceSubmit(distance, isTargetMode);
  };

  const toggleMode = () => {
    setIsTargetMode(!isTargetMode);
  };

  return (
    <div className="flex flex-col gap-4 bg-white rounded-t-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-medium">
          {isTargetMode ? "Distance Target" : "Find Routes"}
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleMode}
          className="flex items-center gap-1 text-xs"
        >
          {isTargetMode ? (
            <>
              <Navigation className="h-4 w-4" />
              <span>Find Routes</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              <span>Set Target</span>
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Distance (miles)</span>
            <Input
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={distance}
              onChange={handleInputChange}
              className="w-20 h-8 text-right"
            />
          </div>
          <Slider
            defaultValue={[1.0]}
            value={[distance]}
            min={0.1}
            max={10}
            step={0.1}
            onValueChange={handleSliderChange}
            className="py-2"
          />
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-route-blue hover:bg-route-blue/90"
        >
          {isLoading ? "Processing..." : isTargetMode ? "Start Run" : "Find Routes"}
        </Button>
      </div>
    </div>
  );
};

export default DistanceInput;
