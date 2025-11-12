import React, { useState, useEffect, useRef } from 'react';
import { TripType, Route, SearchData } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { getAirlines, Airline } from '../api/airlineApi';
import { getAirports, Airport } from '../api/airportApi';

interface FlightSearchPanelProps {
  onSearch: (searchData: SearchData) => void;
  onClearFilters?: () => void;
  disabled?: boolean;
  initialSearchData?: SearchData | null;
}

const MAX_PRICE = 100000;
const MAX_DISPLAYED_AIRLINES = 10;

const FlightSearchPanel: React.FC<FlightSearchPanelProps> = ({ 
  onSearch, 
  onClearFilters,
  disabled = false,
  initialSearchData = null 
}) => {
  const [tripType, setTripType] = useState<TripType>(initialSearchData?.tripType || 'oneWay');
  const [route, setRoute] = useState<Route>(initialSearchData?.route || { 
    origin: '', 
    destination: '', 
    departDate: '' 
  });
  const [returnDate, setReturnDate] = useState<string>(initialSearchData?.returnDate || '');
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airline, setAirline] = useState<string>(initialSearchData?.airline || '');
  const [priceRange, setPriceRange] = useState<[number, number]>(initialSearchData?.priceRange || [0, MAX_PRICE]);
  const [error, setError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // New states for suggestions
  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Airport[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Refs for handling click outside
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null); // Clear any previous errors
        const [airlinesData, airportsData] = await Promise.all([
          getAirlines(),
          getAirports()
        ]);
        setAirlines(airlinesData);
        setAirports(airportsData);
        setError(null); // Ensure error is cleared on success
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load necessary data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Handle click outside to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const findAirportCode = (input: string): string => {
    // First, check if the input is already an airport code (3 uppercase letters)
    if (/^[A-Z]{3}$/.test(input)) {
      return input;
    }

    // If not, search for a city match
    const airport = airports.find(
      airport => airport.city.toLowerCase() === input.toLowerCase()
    );

    return airport ? airport.code : input;
  };

  const handleTripTypeChange = (value: string) => {
    const newType = value as TripType;
    setTripType(newType);
    if (newType !== 'roundTrip') {
      setReturnDate('');
    }
  };

  const handleRouteChange = (
    field: 'origin' | 'destination' | 'departDate',
    value: string
  ) => {
    setRoute(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filterAirports = (input: string): Airport[] => {
    if (!input || input.trim().length === 0 || airports.length === 0) {
      return [];
    }
    const searchTerm = input.toLowerCase().trim();
    return airports.filter(airport => {
      const cityMatch = airport.city?.toLowerCase().includes(searchTerm);
      const codeMatch = airport.code?.toLowerCase().includes(searchTerm);
      return cityMatch || codeMatch;
    }).slice(0, 5); // Limit to 5 suggestions
  };

  const handleOriginInput = (value: string) => {
    handleRouteChange('origin', value);
    const filtered = filterAirports(value);
    setOriginSuggestions(filtered);
    setShowOriginSuggestions(filtered.length > 0);
  };

  const handleDestinationInput = (value: string) => {
    handleRouteChange('destination', value);
    const filtered = filterAirports(value);
    setDestinationSuggestions(filtered);
    setShowDestinationSuggestions(filtered.length > 0);
  };

  const handleSuggestionClick = (type: 'origin' | 'destination', airport: Airport) => {
    handleRouteChange(type, airport.code);
    if (type === 'origin') {
      setShowOriginSuggestions(false);
      setOriginSuggestions([]);
    } else {
      setShowDestinationSuggestions(false);
      setDestinationSuggestions([]);
    }
  };

  const handlePriceChange = (index: 0 | 1, value: string) => {
    const numValue = Number(value);
    
    // Check for negative values
    if (numValue < 0) {
      setPriceError('Price cannot be negative');
      return;
    }

    // Check if min price is greater than max price
    if (index === 0 && numValue > priceRange[1]) {
      setPriceError('Minimum price cannot be greater than maximum price');
      return;
    }

    // Check if max price is less than min price
    if (index === 1 && numValue < priceRange[0]) {
      setPriceError('Maximum price cannot be less than minimum price');
      return;
    }

    setPriceError(null);
    setPriceRange([index === 0 ? numValue : priceRange[0], index === 1 ? numValue : priceRange[1]]);
  };

  const handleSearch = () => {
    // Reset errors
    setError(null);
    setDateError(null);

    // Validate dates only if provided
    if (tripType === 'roundTrip' && returnDate && !route.departDate) {
      setDateError('Please select a departure date for round trip');
      return;
    }

    // Convert city names to airport codes if provided
    let originCode = '';
    let destinationCode = '';
    
    if (route.origin) {
      originCode = findAirportCode(route.origin);
      if (!/^[A-Z]{3}$/.test(originCode)) {
        setError(`Could not find airport for origin: ${route.origin}`);
        return;
      }
    }
    
    if (route.destination) {
      destinationCode = findAirportCode(route.destination);
      if (!/^[A-Z]{3}$/.test(destinationCode)) {
        setError(`Could not find airport for destination: ${route.destination}`);
        return;
      }
    }

    const searchData: SearchData = {
      tripType,
      route: {
        ...route,
        origin: originCode,
        destination: destinationCode
      },
      returnDate: tripType === 'roundTrip' ? returnDate : null,
      airline,
      priceRange,
    };
    onSearch(searchData);
  };

  const handleClearFilters = () => {
    // Reset all form fields to default values
    setRoute({ 
      origin: '', 
      destination: '', 
      departDate: '' 
    });
    setReturnDate('');
    setAirline('all');
    setPriceRange([0, MAX_PRICE]);
    setError(null);
    setDateError(null);
    setPriceError(null);
    
    // Call the parent's clear filters function to show recommendations
    if (onClearFilters) {
      onClearFilters();
    }
  };

  // Get displayed airlines (first 10 + Others if more than 10)
  const displayedAirlines = airlines.length > MAX_DISPLAYED_AIRLINES
    ? [
        ...airlines.slice(0, MAX_DISPLAYED_AIRLINES),
        { code: 'OTHERS', name: 'Others' }
      ]
    : airlines;

  return (
    <div className="border border-gray-200 rounded-xl p-6 md:p-8 bg-white shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Search Flights</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {dateError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {dateError}
        </div>
      )}

      {/* Trip Type Toggle */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => handleTripTypeChange('oneWay')}
            disabled={disabled}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              tripType === 'oneWay'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            One Way
          </button>
          <button
            type="button"
            onClick={() => handleTripTypeChange('roundTrip')}
            disabled={disabled}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
              tripType === 'roundTrip'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Round Trip
          </button>
        </div>
      </div>

      {/* Route Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative" ref={originRef}>
          <label className="block mb-2 text-sm font-medium text-gray-700">From</label>
          <Input
            type="text"
            value={route.origin}
            placeholder="City or airport code"
            onChange={(e) => handleOriginInput(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
          {showOriginSuggestions && originSuggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
              {originSuggestions.map(airport => (
                <div
                  key={airport.code}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionClick('origin', airport)}
                >
                  <div className="font-medium text-gray-900">{airport.city}</div>
                  <div className="text-sm text-gray-500">{airport.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={destinationRef}>
          <label className="block mb-2 text-sm font-medium text-gray-700">To</label>
          <Input
            type="text"
            value={route.destination}
            placeholder="City or airport code"
            onChange={(e) => handleDestinationInput(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
              {destinationSuggestions.map(airport => (
                <div
                  key={airport.code}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionClick('destination', airport)}
                >
                  <div className="font-medium text-gray-900">{airport.city}</div>
                  <div className="text-sm text-gray-500">{airport.code}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Departure Date</label>
          <Input
            type="date"
            value={route.departDate}
            onChange={(e) => handleRouteChange('departDate', e.target.value)}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {tripType === 'roundTrip' && (
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Return Date</label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              disabled={disabled}
              min={route.departDate || undefined}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Airlines and Price Range - Collapsible Advanced Options */}
      <details className="mb-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 mb-4">
          Advanced Options
        </summary>
        <div className="space-y-4 pt-4">
          {/* Airlines Dropdown Selection */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Preferred Airline</label>
            <Select 
              onValueChange={setAirline} 
              value={airline}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Airlines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Airlines</SelectItem>
                {displayedAirlines.map((opt) => (
                  <SelectItem value={opt.code} key={opt.code}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Price Range</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange(0, e.target.value)}
                placeholder="Min"
                className="w-full"
                min="0"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange(1, e.target.value)}
                placeholder="Max"
                className="w-full"
                min="0"
              />
            </div>
            {priceError && (
              <div className="mt-1 text-sm text-red-500">
                {priceError}
              </div>
            )}
          </div>
        </div>
      </details>

      {/* Search and Clear Buttons */}
      <div className="flex gap-3 mt-6">
        <Button 
          onClick={handleSearch}
          variant="default"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer rounded-lg"
        >
          Search Flights
        </Button>
        <Button 
          onClick={handleClearFilters}
          variant="outline"
          className="px-8 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-medium py-6 transition-all duration-200 cursor-pointer rounded-lg"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default FlightSearchPanel;
