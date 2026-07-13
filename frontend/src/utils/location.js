export const formatDetectedLocation = (address = {}, displayName = '') => {
  const candidates = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.suburb,
    address.neighbourhood,
    address.county,
    address.district,
    address.state_district,
    address.state,
  ].filter(Boolean);

  if (candidates.length > 0) return candidates[0];

  if (displayName) {
    const firstPart = displayName.split(',').map((part) => part.trim()).filter(Boolean)[0];
    if (firstPart) return firstPart;
  }

  return 'India';
};

export const reverseGeocodeLocation = async (latitude, longitude, locale = 'en') => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&zoom=10&accept-language=${encodeURIComponent(locale)}`
  );

  if (!response.ok) {
    throw new Error('Failed to reverse geocode location');
  }

  return response.json();
};
