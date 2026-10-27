import { WEATHER_CITIES, type WeatherCity } from '@wslab/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Matches, Max, Min } from 'class-validator';

export class ProductIdParams {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  id: number;
}

export class WeatherQuery {
  @IsIn(WEATHER_CITIES, { message: `city debe ser uno de: ${WEATHER_CITIES.join(', ')}` })
  city: WeatherCity;
}

export class CountryParams {
  @Matches(/^[A-Za-z]{2}$/, { message: 'iso debe ser un código ISO 3166-1 de dos letras' })
  iso: string;
}
