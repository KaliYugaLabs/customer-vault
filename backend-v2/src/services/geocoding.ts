const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'CustomerManager/2.0 (contact@example.com)';

export interface GeocodeResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    'accept-language': 'en'
  });
  
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/search?${params}`,
    {
      headers: {
        'User-Agent': USER_AGENT
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }
  
  const data = await response.json();
  
  if (data.length === 0) {
    return null;
  }
  
  return {
    formattedAddress: data[0].display_name,
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon)
  };
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    'accept-language': 'en'
  });
  
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/search?${params}`,
    {
      headers: {
        'User-Agent': USER_AGENT
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Geocoding service unavailable');
  }
  
  const data = await response.json();
  
  return data.map((item: any) => ({
    formattedAddress: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon)
  }));
}
