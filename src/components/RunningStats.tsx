
import React from 'react';
import { Clock } from 'lucide-react';
import { formatDistance } from '@/utils/locationUtils';

interface RunningStatsProps {
  distance: number;
  targetDistance: number;
  duration: number;
  isRunning: boolean;
  onStopRun: () => void;
}

const RunningStats: React.FC<RunningStatsProps> = ({
  distance,
  targetDistance,
  duration,
  isRunning,
  onStopRun
}) => {
  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((distance / targetDistance) * 100, 100);

  return (
    <div className="bg-white rounded-t-xl p-4 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Current Run</h2>
        <div className="flex items-center gap-1 text-sm font-medium text-route-blue">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Current</span>
            <span className="text-sm font-semibold">{formatDistance(distance)}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Target</span>
            <span className="text-sm font-semibold">{formatDistance(targetDistance)}</span>
          </div>

          <div className="w-full h-2 bg-gray-100 rounded-full mt-2">
            <div 
              className="h-2 rounded-full bg-route-blue transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={onStopRun}
          className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          End Run
        </button>
      </div>
    </div>
  );
};

export default RunningStats;
