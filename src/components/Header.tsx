
import React from 'react';
import { MapPin } from 'lucide-react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-white shadow-sm z-10">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-route-blue" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </div>
  );
};

export default Header;
