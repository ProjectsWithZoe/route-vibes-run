
import React from 'react';
import { formatDistance } from '@/utils/locationUtils';
import { type Route } from '@/utils/mapUtils';

interface RouteCardProps {
  route: Route;
  isActive: boolean;
  onClick: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, isActive, onClick }) => {
  return (
    <div 
      className={`route-card p-3 bg-white rounded-lg mb-3 ${isActive ? 'card-active' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div 
            className="w-3 h-12 rounded-full mr-3" 
            style={{ backgroundColor: route.color }}
          />
          <div>
            <h3 className="font-medium">{route.description}</h3>
            <p className="text-sm text-gray-500">{formatDistance(route.distance)}</p>
          </div>
        </div>
        <div 
          className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100"
        >
          <div 
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: route.color }}
          />
        </div>
      </div>
    </div>
  );
};

export default RouteCard;
