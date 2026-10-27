import Link from 'next/link';
import { BackendUrl } from '@/components/BackendLink';

const SECTIONS = [
  {
    href: '/rest',
    protocol: 'REST',
    title: 'REST/JSON',
    text: 'Servicio propio GET y POST /api/products con validación de datos.',
  },
  {
    href: '/soap',
    protocol: 'SOAP',
    title: 'SOAP/WSDL',
    text: 'Servicio propio con WSDL, consumido por un cliente SOAP desde el gateway.',
  },
  {
    href: '/rss',
    protocol: 'RSS',
    title: 'RSS/XML',
    text: 'Feed RSS propio generado en XML y leído por HTTP desde el gateway.',
  },
  {
    href: '/external',
    protocol: 'Externos',
    title: 'Servicios externos',
    text: 'Consumo de Open-Meteo (REST), CountryInfoService (SOAP) y un feed RSS público.',
  },
];

const STEPS = [
  'El navegador llama al gateway JSON del backend.',
  'El gateway usa un cliente: SOAP con el WSDL, HTTP para RSS o HTTP para REST.',
  'El cliente consume el servicio publicado, propio o externo, y procesa la respuesta.',
  'El gateway devuelve un JSON común con los datos, la duración, los errores y el XML o JSON original.',
];

export default function HomePage() {
  return (
    <>
      <header className="page-header">
        <span className="overline">Práctica de servicios web</span>
        <h1 className="display">Publicar y consumir servicios web</h1>
        <p className="lead">
          El backend NestJS publica servicios REST, SOAP y RSS propios, y los consume junto con servicios
          de terceros. Este frontend solo se comunica con el backend mediante JSON.
        </p>
      </header>

      <div className="grid">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="card">
            <span className="chip">{s.protocol}</span>
            <h2 className="subhead" style={{ marginTop: 16 }}>
              {s.title}
            </h2>
            <p className="small muted">{s.text}</p>
          </Link>
        ))}
      </div>

      <section className="aside">
        <span className="overline">Arquitectura</span>
        <h2 className="subhead">Flujo de comunicación</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="caption">
          Backend: <BackendUrl />
        </p>
      </section>
    </>
  );
}
