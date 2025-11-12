import React from 'react';
import { useNavigate } from 'react-router-dom';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import NavigationBar from '../components/NavigationBar';
import { SearchData } from '../features/search/types';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (searchData: SearchData) => {
    navigate('/search-results', { state: { searchData } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      <NavigationBar />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Book a Flight
            </h1>
          </div>
          
          {/* Search Form Card */}
          <div className="max-w-5xl mx-auto">
            <FlightSearchPanel onSearch={handleSearch} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
