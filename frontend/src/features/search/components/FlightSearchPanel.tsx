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
import { ArrowUpDown } from 'lucide-react';
import { getAirlines, Airline } from '../api/airlineApi';
import { getAirports, Airport } from '../api/airportApi';

interface FlightSearchPanelProps {
  onSearch: (searchData: SearchData) => void;
  onClearFilters?: () => void;
  disabled?: boolean;
  initialSearchData?: SearchData | null;
  compactLayout?: boolean; // When true, uses vertical stacked layout for narrow screens
}

const MAX_PRICE = 100000;
const MAX_DISPLAYED_AIRLINES = 10;

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to get date 1 year from today in YYYY-MM-DD format
const getMaxDate = (): string => {
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);
  return oneYearLater.toISOString().split('T')[0];
};

const FlightSearchPanel: React.FC<FlightSearchPanelProps> = ({ 
  onSearch, 
  onClearFilters,
  disabled = false,
  initialSearchData = null,
  compactLayout = false
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

  const handleSwapOriginDestination = () => {
    // Swap origin and destination values
    setRoute(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));

    // Close any open suggestion dropdowns
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
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

    // Validate round trip: origin and destination must be different
    if (tripType === 'roundTrip' && originCode && destinationCode && originCode === destinationCode) {
      setError('For round trip, please select different cities for origin and destination');
      return;
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
    <div className="border border-teal-200/50 rounded-lg p-3 sm:p-4 bg-white/95 backdrop-blur-sm shadow-md overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3 pb-2 border-b border-gray-100">
        <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Where can we take you?</h2>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          size="sm"
          className="text-xs h-7 px-3 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-900"
        >
          Clear Filters
        </Button>
      </div>

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

      {/* Route Information with Trip Type */}
      {compactLayout ? (
        <div className="mb-2 space-y-2">
          {/* From Field */}
          <div className="relative w-full" ref={originRef}>
            <label className="block mb-1 text-xs font-medium text-teal-700">From</label>
            <Input
              type="text"
              value={route.origin}
              placeholder="City or code"
              onChange={(e) => handleOriginInput(e.target.value)}
              disabled={disabled}
              className="w-full text-sm sm:text-base"
            />
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                {originSuggestions.map(airport => (
                  <div
                    key={airport.code}
                    className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-teal-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => handleSuggestionClick('origin', airport)}
                  >
                    <div className="text-sm sm:text-base font-medium text-gray-900">{airport.city}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{airport.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button - Inline between fields */}
          <div className="flex items-center justify-center -my-1">
            <button
              type="button"
              onClick={handleSwapOriginDestination}
              disabled={disabled}
              className="p-1.5 rounded-full bg-teal-100 hover:bg-teal-200 text-teal-700 hover:text-teal-900 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-teal-200 hover:border-teal-300 shadow-sm hover:shadow-md active:scale-95"
              aria-label="Swap origin and destination"
              title="Swap origin and destination"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* To Field */}
          <div className="relative w-full" ref={destinationRef}>
            <label className="block mb-1 text-xs font-medium text-teal-700">To</label>
            <Input
              type="text"
              value={route.destination}
              placeholder="City or code"
              onChange={(e) => handleDestinationInput(e.target.value)}
              disabled={disabled}
              className="w-full text-sm sm:text-base"
            />
            {showDestinationSuggestions && destinationSuggestions.length > 0 && (
              <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                {destinationSuggestions.map(airport => (
                  <div
                    key={airport.code}
                    className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-teal-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => handleSuggestionClick('destination', airport)}
                  >
                    <div className="text-sm sm:text-base font-medium text-gray-900">{airport.city}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{airport.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-2">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_1fr] gap-2 items-end">
            {/* Trip Type Dropdown */}
            <div className="md:mr-2">
              <Select 
                value={tripType} 
                onValueChange={(value) => handleTripTypeChange(value as TripType)}
                disabled={disabled}
              >
                <SelectTrigger className="w-full md:w-32 text-sm h-9">
                  <SelectValue placeholder="Trip Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oneWay">One Way</SelectItem>
                  <SelectItem value="roundTrip">Round Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* From Field */}
            <div className="relative w-full" ref={originRef}>
              <label className="block mb-1 text-xs font-medium text-teal-700">From</label>
              <Input
                type="text"
                value={route.origin}
                placeholder="City or code"
                onChange={(e) => handleOriginInput(e.target.value)}
                disabled={disabled}
                className="w-full text-sm sm:text-base"
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                  {originSuggestions.map(airport => (
                    <div
                      key={airport.code}
                      className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-teal-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => handleSuggestionClick('origin', airport)}
                    >
                      <div className="text-sm sm:text-base font-medium text-gray-900">{airport.city}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{airport.code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex items-end justify-center md:justify-center">
              <button
                type="button"
                onClick={handleSwapOriginDestination}
                disabled={disabled}
                className="mb-[2px] md:mb-[2px] p-2.5 rounded-full bg-teal-100 hover:bg-teal-200 text-teal-700 hover:text-teal-900 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-teal-200 hover:border-teal-300 shadow-sm hover:shadow-md active:scale-95"
                aria-label="Swap origin and destination"
                title="Swap origin and destination"
              >
                <ArrowUpDown className="h-5 w-5" />
              </button>
            </div>

            {/* To Field */}
            <div className="relative w-full" ref={destinationRef}>
              <label className="block mb-1 text-xs font-medium text-teal-700">To</label>
              <Input
                type="text"
                value={route.destination}
                placeholder="City or code"
                onChange={(e) => handleDestinationInput(e.target.value)}
                disabled={disabled}
                className="w-full text-sm sm:text-base"
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                  {destinationSuggestions.map(airport => (
                    <div
                      key={airport.code}
                      className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-teal-50 cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => handleSuggestionClick('destination', airport)}
                    >
                      <div className="text-sm sm:text-base font-medium text-gray-900">{airport.city}</div>
                      <div className="text-xs sm:text-sm text-gray-500">{airport.code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trip Type Dropdown for compact layout */}
      {compactLayout && (
        <div className="mb-2">
          <Select 
            value={tripType} 
            onValueChange={(value) => handleTripTypeChange(value as TripType)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Trip Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneWay">One Way</SelectItem>
              <SelectItem value="roundTrip">Round Trip</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date Selection */}
      {compactLayout ? (
        <div className="mb-2 space-y-2">
          <div className="relative w-full min-w-0">
            <label className="block mb-1 text-xs font-medium text-teal-700">Departure Date</label>
            <Input
              type="date"
              value={route.departDate}
              onChange={(e) => handleRouteChange('departDate', e.target.value)}
              disabled={disabled}
              min={getTodayDate()}
              max={getMaxDate()}
              className="w-full text-sm sm:text-base"
              style={{
                paddingRight: '2.5rem',
                minWidth: '160px'
              }}
            />
          </div>

          {tripType === 'roundTrip' && (
            <div className="relative w-full min-w-0">
              <label className="block mb-1 text-xs font-medium text-teal-700">Return Date</label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={disabled}
                min={route.departDate || getTodayDate()}
                max={getMaxDate()}
                className="w-full text-sm sm:text-base"
                style={{
                  paddingRight: '2.5rem',
                  minWidth: '160px'
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <div className="relative w-full min-w-0">
            <label className="block mb-1 text-xs font-medium text-teal-700">Departure Date</label>
            <Input
              type="date"
              value={route.departDate}
              onChange={(e) => handleRouteChange('departDate', e.target.value)}
              disabled={disabled}
              min={getTodayDate()}
              max={getMaxDate()}
              className="w-full text-sm sm:text-base"
              style={{
                paddingRight: '2.5rem',
                minWidth: '160px'
              }}
            />
          </div>

          {tripType === 'roundTrip' && (
            <div className="relative w-full min-w-0">
              <label className="block mb-1 text-xs font-medium text-teal-700">Return Date</label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={disabled}
                min={route.departDate || getTodayDate()}
                max={getMaxDate()}
                className="w-full text-sm sm:text-base"
                style={{
                  paddingRight: '2.5rem',
                  minWidth: '160px'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Airlines and Price Range - Collapsible Advanced Options */}
      <details className="mb-2 sm:mb-3">
        <summary className="cursor-pointer text-xs font-medium text-teal-700 hover:text-teal-900 mb-1.5 p-1.5 rounded-lg hover:bg-teal-50 transition-colors">
          Advanced Options
        </summary>
        <div className="pt-1.5 sm:pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {/* Airlines Dropdown Selection */}
            <div>
              <label className="block mb-1.5 text-xs font-medium text-teal-700">Preferred Airline</label>
              <Select 
                onValueChange={setAirline} 
                value={airline}
                disabled={disabled}
              >
                <SelectTrigger className="w-full text-sm">
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
              <label className="block mb-1.5 text-xs font-medium text-teal-700">Price Range</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceChange(0, e.target.value)}
                  placeholder="Min"
                  className="w-full text-sm"
                  min="0"
                />
                <span className="text-xs text-gray-500">-</span>
                <Input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceChange(1, e.target.value)}
                  placeholder="Max"
                  className="w-full text-sm"
                  min="0"
                />
              </div>
              {priceError && (
                <div className="mt-1 text-xs text-red-500">
                  {priceError}
                </div>
              )}
            </div>
          </div>
        </div>
      </details>

      {/* Search Button */}
      <div className="mt-2 sm:mt-3 pt-2 border-t border-gray-100">
        <Button 
          onClick={handleSearch}
          variant="default"
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium py-2 text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer rounded-lg"
        >
          Search Flights
        </Button>
      </div>
    </div>
  );
};

export default FlightSearchPanel;
