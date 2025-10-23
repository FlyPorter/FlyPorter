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
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <FlightSearchPanel onSearch={handleSearch} />
      </div>
    </div>
  );
};

export default SearchPage;
