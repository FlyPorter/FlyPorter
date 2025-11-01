import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with the customParseFormat plugin
dayjs.extend(customParseFormat);

interface FlightTimeInfo {
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
}

export const calculateFlightTimes = (
  departureTime: string,
  duration: number,
  departureDate: string
): FlightTimeInfo => {
  // Parse departure time
  const [depHours, depMinutes] = departureTime.split(':').map(Number);
  
  // Parse the date string (assuming format: YYYY-MM-DD)
  const [year, month, day] = departureDate.split('T')[0].split('-').map(Number);
  
  // Create a dayjs object for departure
  const departureDateTime = dayjs()
    .year(year)
    .month(month - 1) // dayjs months are 0-indexed
    .date(day)
    .hour(depHours)
    .minute(depMinutes);

  // Add duration to get arrival time
  const arrivalDateTime = departureDateTime.add(duration, 'minute');

  // Format times
  const formattedDepartureTime = departureDateTime.format('HH:mm');
  const formattedArrivalTime = arrivalDateTime.format('HH:mm');

  // Format dates
  const formattedDepartureDate = departureDateTime.format('ddd, MMM D, YYYY');
  const formattedArrivalDate = arrivalDateTime.format('ddd, MMM D, YYYY');

  return {
    departureTime: formattedDepartureTime,
    arrivalTime: formattedArrivalTime,
    departureDate: formattedDepartureDate,
    arrivalDate: formattedArrivalDate
  };
}; 