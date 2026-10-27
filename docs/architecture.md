# Arquitectura

## Paquetes del monorepo

El monorepo usa **pnpm workspaces** (`pnpm-workspace.yaml` incluye `apps/*` y `packages/*`). No se usa ningún otro gestor de monorepos.

| Paquete | Carpeta | Responsabilidad |
|---|---|---|
| `@wslab/backend` | `apps/backend` | Publica REST, SOAP/WSDL y RSS; consume servicios propios y externos; expone el gateway JSON |
| `@wslab/frontend` | `apps/frontend` | Interfaz de demostración; solo habla con el backend por JSON |
| `@wslab/shared` | `packages/shared` | Tipos compartidos (`Product`, `GatewayResult`, `RssFeed`, `WeatherReport`, `CountryInfo`) y la lista de ciudades permitidas |

Los paquetes dependen de `@wslab/shared` mediante `"workspace:*"`. `shared` se compila a `dist/` (JavaScript ESM y declaraciones `.d.ts`) porque el compilador de NestJS no admite archivos `.ts` fuera de su carpeta `src`. Los scripts `dev`, `typecheck` y `test` de la raíz lo compilan primero, y `pnpm -r build` respeta el orden de dependencias.

## Variables de entorno

Hay un solo archivo `.env`, en la raíz del monorepo (plantilla: `.env.example`).

- **Backend**: `src/config/root-env.ts` sube de carpeta desde el directorio de trabajo hasta encontrar `pnpm-workspace.yaml` y carga ese `.env` con `process.loadEnvFile`. `loadConfig()` valida los valores al arrancar.
- **Frontend**: `next.config.ts` busca la misma raíz, lee el `.env` con `util.parseEnv` y entrega `NEXT_PUBLIC_API_URL` y `BACKEND_PORT` mediante la opción `env`. También calcula `allowedDevOrigins` con las IP de la red local del equipo.
- Las variables definidas en el sistema operativo tienen prioridad sobre las del archivo.

## Módulos del backend

```
AppModule
├── ConfigModule      lee y valida las variables de entorno (global)
├── RestModule        ProductsController            GET/POST /api/products
├── SoapModule        ProductsSoapService           /soap/products y /soap/products?wsdl
├── RssModule         RssController                 /rss/products.xml
└── GatewayModule     GatewayController             /api/gateway/*
    └── ConsumersModule
        ├── OwnSoapClient      cliente SOAP del servicio propio (usa su WSDL)
        ├── RssClient          lee el RSS propio y el RSS externo por HTTP
        ├── OpenMeteoClient    cliente REST de Open-Meteo
        └── CountryInfoClient  cliente SOAP de CountryInfoService (usa su WSDL)
```

`ProductsModule` (catálogo en memoria) lo importan REST, SOAP y RSS. Como NestJS crea una sola instancia por módulo, los tres servicios publican los mismos datos: un producto creado por REST aparece en SOAP y en RSS.

El gateway y los clientes **no** importan `ProductsModule`. Solo conocen las URLs públicas de los servicios, de modo que todo lo que muestran proviene de una llamada HTTP real.

## Flujo de comunicación

```
 Navegador (Next.js, puerto 3000)
     │  JSON (fetch)
     ▼
 Backend NestJS (puerto 4000)
 ┌──────────────────────────────────────────────────────────────────────┐
 │ /api/products  ◄──────────── REST propio (JSON) ◄── el frontend lo   │
 │                                                     usa directamente │
 │ /api/gateway/* ──► GatewayController                                 │
 │                      │                                               │
 │        ┌─────────────┼──────────────┬───────────────┬──────────────┐ │
 │        ▼             ▼              ▼               ▼              ▼ │
 │  OwnSoapClient   RssClient     RssClient     OpenMeteoClient CountryInfoClient
 │        │ SOAP/XML    │ HTTP/XML     │ HTTP/XML      │ HTTP/JSON    │ SOAP/XML
 │        ▼             ▼              │               │              │ │
 │  /soap/products  /rss/products.xml  │               │              │ │
 │  (servicio propio, mismo proceso)   │               │              │ │
 └─────────────────────────────────────┼───────────────┼──────────────┼─┘
                                       ▼               ▼              ▼
                              Feed RSS público   api.open-meteo.com  webservices.oorsprong.org
```

1. El frontend envía una solicitud JSON al gateway, por ejemplo `GET /api/gateway/soap/products`.
2. El gateway valida los parámetros (id numérico, ciudad de la lista, código ISO de dos letras).
3. El cliente correspondiente hace la llamada real:
   - **SOAP**: descarga el WSDL, `node-soap` genera el cliente, construye el sobre XML y lo envía por HTTP POST.
   - **RSS**: `fetch` con tiempo de espera y límite de tamaño; el XML se analiza con `fast-xml-parser`.
   - **REST externo**: `fetch` a Open-Meteo y validación de los campos del JSON.
4. La función `execute()` mide la duración y transforma cualquier error en un código estable (`TIMEOUT`, `CONNECTION_ERROR`, `SOAP_FAULT`, `NOT_FOUND`, `INVALID_RESPONSE`, `UPSTREAM_ERROR`).
5. El gateway responde siempre con la misma estructura `GatewayResult` y ajusta el código HTTP: 200 si todo salió bien, 404 si el recurso no existe, 504 por tiempo de espera y 502 por los demás fallos.

```ts
interface GatewayResult<T> {
  source: 'own-soap' | 'own-rss' | 'open-meteo' | 'country-info' | 'external-rss';
  protocol: 'REST' | 'SOAP' | 'RSS';
  endpoint: string;     // servicio consumido
  ok: boolean;
  durationMs: number;
  data: T | null;
  raw?: string;         // XML o JSON original recibido
  rawRequest?: string;  // sobre SOAP enviado
  error?: { code: string; message: string };
}
```

## Aislamiento de fallos

- Cada cliente captura sus errores; un servicio externo caído produce `ok: false` en esa ruta y nada más.
- Todas las solicitudes salientes tienen tiempo de espera (`HTTP_TIMEOUT_MS`, 8 s por defecto).
- Las pruebas e2e comprueban que, después de fallos de conexión, de tiempo de espera y de XML inválido, el backend sigue respondiendo.

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| Un solo proceso NestJS para todos los servicios | La práctica no requiere microservicios; es más fácil de ejecutar y presentar |
| `soap.listen()` sobre la instancia Express de NestJS | node-soap registra la ruta en Express; se espera a que termine antes de `app.init()` para que la ruta quede antes del manejador 404 de NestJS |
| El cliente SOAP se crea en cada consulta | La demostración siempre descarga y usa el WSDL publicado (`disableCache: true`) |
| URLs externas solo desde configuración | Evita solicitudes a URLs arbitrarias (SSRF) |
| NestJS 12 en modo ESM con Vitest | Es la configuración que genera el CLI oficial de NestJS 12 |
| TypeScript 6.0 | `@nestjs/cli` 12 declara compatibilidad con `~6.0` |
