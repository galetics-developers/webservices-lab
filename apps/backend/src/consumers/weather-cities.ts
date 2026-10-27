import type { WeatherCity } from '@wslab/shared';

export const CITY_COORDINATES: Record<WeatherCity, { name: string; latitude: number; longitude: number }> = {
  'ciudad-de-mexico': { name: 'Ciudad de México', latitude: 19.4326, longitude: -99.1332 },
  guadalajara: { name: 'Guadalajara', latitude: 20.6597, longitude: -103.3496 },
  monterrey: { name: 'Monterrey', latitude: 25.6866, longitude: -100.3161 },
  bogota: { name: 'Bogotá', latitude: 4.711, longitude: -74.0721 },
  madrid: { name: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
};
