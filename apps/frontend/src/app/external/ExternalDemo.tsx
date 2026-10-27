'use client';

import {
  WEATHER_CITIES,
  type CountryInfo,
  type GatewayResult,
  type RssFeed,
  type WeatherCity,
  type WeatherReport,
} from '@wslab/shared';
import { useState } from 'react';
import { GatewayResultView } from '@/components/GatewayResultView';
import { RssItems } from '@/components/RssItems';
import { useRequest } from '@/lib/use-request';

const CITY_LABELS: Record<WeatherCity, string> = {
  'ciudad-de-mexico': 'Ciudad de México',
  guadalajara: 'Guadalajara',
  monterrey: 'Monterrey',
  bogota: 'Bogotá',
  madrid: 'Madrid',
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ExternalDemo() {
  const weather = useRequest<GatewayResult<WeatherReport>>();
  const country = useRequest<GatewayResult<CountryInfo>>();
  const rss = useRequest<GatewayResult<RssFeed>>();
  const [city, setCity] = useState<WeatherCity>('ciudad-de-mexico');
  const [iso, setIso] = useState('MX');

  return (
    <>
      <section className="card">
        <div className="card-title">
          <span className="chip">REST</span>
          <h2 className="subhead">Open-Meteo: clima actual</h2>
        </div>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            void weather.run(`/api/gateway/external/weather?city=${encodeURIComponent(city)}`);
          }}
        >
          <div className="field">
            <label htmlFor="city">Ciudad</label>
            <select id="city" value={city} onChange={(e) => setCity(e.target.value as WeatherCity)}>
              {WEATHER_CITIES.map((c) => (
                <option key={c} value={c}>
                  {CITY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" disabled={weather.loading}>
            Consultar
          </button>
        </form>
        <GatewayResultView response={weather.response} loading={weather.loading}>
          {(w) => (
            <dl className="meta">
              <Fact label="Ciudad" value={w.cityName} />
              <Fact label="Temperatura" value={`${w.temperatureC} °C`} />
              <Fact label="Humedad" value={`${w.relativeHumidity} %`} />
              <Fact label="Viento" value={`${w.windSpeedKmh} km/h`} />
              <Fact label="Código WMO" value={String(w.weatherCode)} />
              <Fact label="Hora local" value={w.time} />
            </dl>
          )}
        </GatewayResultView>
      </section>

      <section className="card">
        <div className="card-title">
          <span className="chip">SOAP</span>
          <h2 className="subhead">CountryInfoService: FullCountryInfo</h2>
        </div>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            void country.run(`/api/gateway/external/countries/${encodeURIComponent(iso)}`);
          }}
        >
          <div className="field">
            <label htmlFor="iso">Código ISO (2 letras)</label>
            <input id="iso" value={iso} maxLength={2} onChange={(e) => setIso(e.target.value.toUpperCase())} />
          </div>
          <button type="submit" className="btn" disabled={country.loading}>
            Consultar
          </button>
        </form>
        <GatewayResultView response={country.response} loading={country.loading}>
          {(c) => (
            <dl className="meta">
              <Fact label="País" value={c.name} />
              <Fact label="Capital" value={c.capitalCity} />
              <Fact label="Código telefónico" value={`+${c.phoneCode}`} />
              <Fact label="Continente" value={c.continentCode} />
              <Fact label="Moneda" value={c.currencyIsoCode} />
              <Fact label="Idiomas" value={c.languages.map((l) => l.name).join(', ') || 'Sin datos'} />
            </dl>
          )}
        </GatewayResultView>
      </section>

      <section className="card">
        <div className="card-title">
          <span className="chip">RSS</span>
          <h2 className="subhead">Feed público</h2>
        </div>
        <div className="form-row">
          <button type="button" className="btn" onClick={() => rss.run('/api/gateway/external/rss')} disabled={rss.loading}>
            Leer feed externo
          </button>
        </div>
        <GatewayResultView response={rss.response} loading={rss.loading}>
          {(data) => <RssItems feed={data} />}
        </GatewayResultView>
      </section>
    </>
  );
}
