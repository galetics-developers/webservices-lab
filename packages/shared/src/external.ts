export const WEATHER_CITIES = [
  'ciudad-de-mexico',
  'guadalajara',
  'monterrey',
  'bogota',
  'madrid',
] as const;

export type WeatherCity = (typeof WEATHER_CITIES)[number];

export interface WeatherReport {
  city: WeatherCity;
  cityName: string;
  latitude: number;
  longitude: number;
  time: string;
  temperatureC: number;
  relativeHumidity: number;
  windSpeedKmh: number;
  weatherCode: number;
}

export interface CountryLanguage {
  isoCode: string;
  name: string;
}

export interface CountryInfo {
  isoCode: string;
  name: string;
  capitalCity: string;
  phoneCode: string;
  continentCode: string;
  currencyIsoCode: string;
  flagUrl: string;
  languages: CountryLanguage[];
}
