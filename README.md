# webservices-lab

Práctica académica de servicios web: **publicar servicios web propios y consumir servicios web propios y de terceros** dentro de un monorepo administrado con **pnpm workspaces**.

- Servicios propios publicados: **REST/JSON**, **SOAP/WSDL** y **RSS/XML** (NestJS).
- Servicios consumidos: el SOAP y el RSS propios, y tres servicios externos: **Open-Meteo** (REST), **CountryInfoService** (SOAP) y un **feed RSS público**.
- Un **gateway JSON** en el backend expone los resultados al frontend (Next.js).

Repositorio en GitHub: _pendiente de crear_ (ver [Publicación en GitHub](#publicación-en-github)).

## Objetivo académico

1. Crear y publicar un servicio web propio.
2. Consumir un servicio web de terceros.
3. Usar tecnologías apropiadas para ambos objetivos.
4. Demostrar el funcionamiento mediante pruebas.
5. Documentar el procedimiento, las dificultades y los resultados.

El catálogo de productos es solo un dominio de ejemplo en memoria; no es un sistema de inventario.

## Tecnologías

| Herramienta | Versión | Uso |
|---|---|---|
| Node.js | 22 o superior | Entorno de ejecución |
| pnpm | 10.28 (fijado en `packageManager`) | Gestor de paquetes y workspaces |
| TypeScript | 6.0.3 | Lenguaje en los tres paquetes |
| NestJS | 12.2 (ESM) | Backend: REST, SOAP, RSS y gateway |
| class-validator / class-transformer | 0.15 / 0.5 | Validación de entradas |
| soap (node-soap) | 1.14 | Servidor SOAP con WSDL y clientes SOAP |
| feed | 6.0 | Generación del feed RSS 2.0 |
| fast-xml-parser | 5.11 | Lectura segura de RSS |
| Next.js / React | 16.4 / 19.3 | Frontend (App Router) |
| @fontsource (Archivo Black, Work Sans, Space Mono) | 5.3 | Tipografías del diseño VoiceBox, incluidas sin depender de Google Fonts |
| Vitest + Supertest | 4.1 / 7.3 | Pruebas unitarias y e2e del backend |

Las versiones exactas están fijadas en `pnpm-lock.yaml`.

## Requisitos previos

- Node.js 22 o superior (`node -v`).
- pnpm 10 (`corepack enable` activa la versión indicada en `package.json`, o `npm install -g pnpm@10.28.0`).
- Acceso a internet para instalar dependencias y para los servicios externos.

## Instalación

```bash
git clone <URL-del-repositorio> webservices-lab
cd webservices-lab
pnpm install
```

## Variables de entorno

Todo el monorepo usa **un solo archivo `.env` en la raíz**. El backend y el frontend lo buscan subiendo de carpeta hasta encontrar `pnpm-workspace.yaml`, así que no hay archivos `.env` en `apps/`. Todas las variables tienen valores por defecto: el proyecto funciona aunque no exista el archivo.

```bash
cp .env.example .env
```

En Windows (PowerShell): `Copy-Item .env.example .env`.

Ningún servicio requiere credenciales. El archivo `.env` está excluido de git; solo se versiona `.env.example`.

### Abrir el frontend desde la red local

Next.js muestra una dirección `Network` (por ejemplo `http://192.168.1.8:3000`). Esa dirección funciona sin configuración adicional: el frontend la agrega a `allowedDevOrigins` y el backend la acepta en CORS. Si abre la página desde otro dispositivo, el firewall del equipo debe permitir los puertos 3000 y 4000.

## Comandos

| Comando | Acción |
|---|---|
| `pnpm dev` | Compila `@wslab/shared` y arranca backend (puerto 4000) y frontend (puerto 3000) en modo desarrollo |
| `pnpm build` | Compila `shared`, `backend` y `frontend` |
| `pnpm start` | Arranca backend y frontend compilados (requiere `pnpm build`) |
| `pnpm typecheck` | Verificación de tipos en los tres paquetes |
| `pnpm test` | Pruebas unitarias y e2e del backend |
| `pnpm verify` | `typecheck` + `test` + `build` |
| `pnpm --filter @wslab/backend dev` | Solo el backend |
| `pnpm --filter @wslab/frontend dev` | Solo el frontend |

Después de `pnpm dev`:

- Frontend: <http://localhost:3000>
- REST: <http://localhost:4000/api/products>
- WSDL: <http://localhost:4000/soap/products?wsdl>
- RSS: <http://localhost:4000/rss/products.xml>
- Gateway: <http://localhost:4000/api/gateway/soap/products>

## Pruebas rápidas

```bash
curl http://localhost:4000/api/products
curl -X POST http://localhost:4000/api/products -H "Content-Type: application/json" -d "{\"name\":\"Mouse\",\"category\":\"Periféricos\",\"price\":349.99}"
curl "http://localhost:4000/soap/products?wsdl"
curl -X POST http://localhost:4000/soap/products -H "Content-Type: text/xml; charset=utf-8" --data @docs/examples/get-product-by-id.xml
curl http://localhost:4000/rss/products.xml
curl http://localhost:4000/api/gateway/soap/products
curl "http://localhost:4000/api/gateway/external/weather?city=ciudad-de-mexico"
```

En PowerShell use `curl.exe` en lugar de `curl`. La lista completa de pruebas y resultados está en [docs/testing.md](docs/testing.md).

## Estructura del monorepo

```
webservices-lab/
├── apps/
│   ├── backend/                 @wslab/backend (NestJS)
│   │   ├── src/
│   │   │   ├── products/        catálogo en memoria
│   │   │   ├── rest/            publicación REST (GET y POST /api/products)
│   │   │   ├── soap/            WSDL y publicación SOAP (/soap/products)
│   │   │   ├── rss/             publicación RSS (/rss/products.xml)
│   │   │   ├── consumers/       clientes de servicios propios y externos
│   │   │   ├── gateway/         gateway JSON para el frontend (/api/gateway/*)
│   │   │   ├── config/          lectura del .env de la raíz y validación de variables
│   │   │   ├── setup-app.ts     CORS, validación y publicación SOAP
│   │   │   └── main.ts
│   │   └── test/                pruebas e2e
│   └── frontend/                @wslab/frontend (Next.js)
│       └── src/
│           ├── app/             páginas: inicio, rest, soap, rss, external
│           ├── components/      vistas de resultados, tablas y XML/JSON original
│           └── lib/             cliente JSON del gateway
├── packages/
│   └── shared/                  @wslab/shared: tipos compartidos
├── docs/                        documentación técnica
├── .env.example                 plantilla del único .env (en la raíz)
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.base.json
```

## Documentación

- [docs/architecture.md](docs/architecture.md): estructura y flujo de comunicación.
- [docs/services.md](docs/services.md): cómo se publican y consumen los servicios; conceptos de REST, SOAP, WSDL, XML y RSS.
- [docs/testing.md](docs/testing.md): endpoints, comandos y resultados de las pruebas ejecutadas.
- [docs/experience.md](docs/experience.md): guía para explicar la experiencia en la presentación.

## Publicación en GitHub

El repositorio local ya está inicializado con un primer commit. Para publicarlo:

```bash
# 1. Crear un repositorio vacío en https://github.com/new (sin README ni .gitignore).
# 2. Conectarlo y subir la rama principal:
git remote add origin https://github.com/<usuario>/webservices-lab.git
git branch -M main
git push -u origin main
```

Con GitHub CLI: `gh repo create webservices-lab --private --source . --push`.

Después de publicarlo, actualice el enlace al inicio de este archivo.
