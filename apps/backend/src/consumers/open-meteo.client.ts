import { Inject, Injectable } from '@nestjs/common';
import type { GatewayResult, WeatherCity, WeatherReport } from '@wslab/shared';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { ConsumerError } from './consumer-error.js';
import { execute } from './execute.js';
import { fetchText } from './http-text.js';
import { CITY_COORDINATES } from './weather-cities.js';

const CURRENT_FIELDS = 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code';

@Injectable()
export class OpenMeteoClient {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  getCurrentWeather(city: WeatherCity): Promise<GatewayResult<WeatherReport>> {
    const coords = CITY_COORDINATES[city];
    const url = new URL(this.config.openMeteoBaseUrl);
    url.searchParams.set('latitude', String(coords.latitude));
    url.searchParams.set('longitude', String(coords.longitude));
    url.searchParams.set('current', CURRENT_FIELDS);
    url.searchParams.set('timezone', 'auto');

    return execute('open-meteo', 'REST', url.href, async (trace) => {
      const response = await fetchText(url.href, {
        timeoutMs: this.config.httpTimeoutMs,
        accept: 'application/json',
      });
      trace.raw = response.body;

      let json: any;
      try {
        json = JSON.parse(response.body);
      } catch {
        throw new ConsumerError('INVALID_RESPONSE', 'Open-Meteo no devolvió JSON válido');
      }

      const current = json?.current;
      const numbers = [
        current?.temperature_2m,
        current?.relative_humidity_2m,
        current?.wind_speed_10m,
        current?.weather_code,
      ];
      if (typeof current?.time !== 'string' || !numbers.every((n) => typeof n === 'number')) {
        throw new ConsumerError('INVALID_RESPONSE', 'La respuesta de Open-Meteo no tiene los campos esperados');
      }

      return {
        raw: response.body,
        data: {
          city,
          cityName: coords.name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          time: current.time,
          temperatureC: current.temperature_2m,
          relativeHumidity: current.relative_humidity_2m,
          windSpeedKmh: current.wind_speed_10m,
          weatherCode: current.weather_code,
        },
      };
    });
  }
}
