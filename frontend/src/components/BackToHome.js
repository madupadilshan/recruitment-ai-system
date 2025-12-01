import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackToHome = () => {
  const location = useLocation();
  
  // Don't show on dashboard, login, or signup pages
  if (['/', '/signup', '/dashboard'].includes(location.pathname)) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-2">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Home
      </Link>
    </div>
  );
};

export default BackToHome;
