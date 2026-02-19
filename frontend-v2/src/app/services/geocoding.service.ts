import { Injectable } from '@angular/core';
import { AddressSuggestion } from '../models/customer.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private nominatimUrl = environment.nominatimUrl;
  private readonly USER_AGENT = 'CustomerManager/2.0 (contact@example.com)';
  
  async searchAddress(query: string): Promise<AddressSuggestion[]> {
    if (!query || query.length < 3) return [];
    
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      'accept-language': 'en'
    });
    
    try {
      const response = await fetch(
        `${this.nominatimUrl}/search?${params}`,
        {
          headers: {
            'User-Agent': this.USER_AGENT
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      return data.map((item: any) => ({
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }
  
  async geocodeAddress(address: string): Promise<AddressSuggestion | null> {
    if (!address || address.trim() === '') return null;
    
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      'accept-language': 'en'
    });
    
    try {
      const response = await fetch(
        `${this.nominatimUrl}/search?${params}`,
        {
          headers: {
            'User-Agent': this.USER_AGENT
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
        displayName: data[0].display_name,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
}
