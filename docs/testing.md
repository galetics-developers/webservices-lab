# Pruebas

Este documento lista los endpoints, los comandos para comprobarlos y los resultados **realmente obtenidos** durante el desarrollo.

Entorno de ejecución de las pruebas: contenedor Linux, Node.js 22.22.0, pnpm 10.28.0, fecha 2026-10-27.

> **Limitación importante:** la red de ese entorno solo permitía el registro de npm. Los hosts `api.open-meteo.com`, `webservices.oorsprong.org` y `feeds.bbci.co.uk` estaban bloqueados. Por eso las pruebas **contra los servicios externos reales no se pudieron completar**. Sí se comprobó que sus fallos se manejan correctamente. Hay que repetir esas pruebas en un equipo con acceso a internet (sección 5).

## 1. Endpoints

| Método | Ruta | Tipo |
|---|---|---|
| GET | `/api/products` | REST propio |
| POST | `/api/products` | REST propio |
| GET | `/soap/products?wsdl` | WSDL propio |
| POST | `/soap/products` | SOAP propio |
| GET | `/rss/products.xml` | RSS propio |
| GET | `/api/gateway/soap/products` | Gateway: SOAP propio, `ListProducts` |
| GET | `/api/gateway/soap/products/:id` | Gateway: SOAP propio, `GetProductById` |
| GET | `/api/gateway/rss/products` | Gateway: RSS propio |
| GET | `/api/gateway/external/weather?city=` | Gateway: Open-Meteo |
| GET | `/api/gateway/external/countries/:iso` | Gateway: CountryInfoService |
| GET | `/api/gateway/external/rss` | Gateway: RSS público |

Valores válidos de `city`: `ciudad-de-mexico`, `guadalajara`, `monterrey`, `bogota`, `madrid`.

## 2. Verificación del monorepo

| Comprobación | Comando | Resultado |
|---|---|---|
| pnpm reconoce el monorepo | `pnpm -r ls --depth -1` | Correcto: lista `webservices-lab`, `@wslab/backend`, `@wslab/frontend` y `@wslab/shared` |
| Instalación de dependencias | `pnpm install` | Correcto: genera `pnpm-lock.yaml` |
| Verificación TypeScript | `pnpm typecheck` | Correcto en los tres paquetes |
| Compilación | `pnpm build` | Correcto: `shared` (tsc), `backend` (nest build), `frontend` (next build, 7 rutas estáticas) |
| Pruebas | `pnpm test` | Correcto: 20 unitarias y 23 e2e |
| Todo lo anterior | `pnpm verify` | Código de salida 0 |

## 3. Pruebas automatizadas (Vitest + Supertest)

Se ejecutan con `pnpm test`. Las pruebas e2e levantan la aplicación en un puerto real, de modo que los clientes SOAP y RSS hacen solicitudes HTTP reales contra ella.

Resultado obtenido: **5 archivos y 20 pruebas unitarias aprobadas; 4 archivos y 23 pruebas e2e aprobadas.**

### Unitarias (`apps/backend/src/**/*.spec.ts`)

| Archivo | Prueba | Resultado |
|---|---|---|
| `products.service.spec.ts` | Inicia con los productos de ejemplo | Aprobada |
| | Agrega productos con id incremental | Aprobada |
| | Devuelve copias para que el catálogo no se modifique desde fuera | Aprobada |
| | Devuelve `undefined` si el producto no existe | Aprobada |
| `app-config.spec.ts` | Valores por defecto sin variables | Aprobada |
| | Agrega `localhost`, `127.0.0.1` y las IP de la red local como orígenes permitidos | Aprobada |
| | Acepta orígenes adicionales separados por comas | Aprobada |
| | Quita la barra final de `PUBLIC_BASE_URL` | Aprobada |
| | Rechaza URLs inválidas o con protocolos no permitidos (`file://`, `ftp://`) | Aprobada |
| | Valida el rango del tiempo de espera | Aprobada |
| `root-env.spec.ts` | Encuentra la raíz del monorepo desde la carpeta del backend | Aprobada |
| | Devuelve `undefined` fuera de un monorepo | Aprobada |
| `rss-parser.spec.ts` | Convierte un RSS 2.0 válido (CDATA, entidades estándar) | Aprobada |
| | Rechaza documentos con DOCTYPE o entidades (XXE) | Aprobada |
| | Rechaza XML que no es RSS | Aprobada |
| `consumer-error.spec.ts` | Detecta tiempos de espera de `fetch` y de axios | Aprobada |
| | Detecta errores de conexión | Aprobada |
| | Traduce SOAP Fault y distingue `NOT_FOUND` | Aprobada |
| | Resume el error de descarga del WSDL | Aprobada |
| | Conserva los `ConsumerError` existentes | Aprobada |

### E2E (`apps/backend/test/*.e2e-spec.ts`)

| Archivo | Prueba | Resultado |
|---|---|---|
| `rest.e2e-spec.ts` | GET devuelve los productos en JSON | Aprobada |
| | POST agrega un producto y responde 201 | Aprobada |
| | POST rechaza datos inválidos con 400 | Aprobada |
| | POST rechaza propiedades no declaradas | Aprobada |
| | CORS solo autoriza los orígenes del frontend (`localhost` y `127.0.0.1` sí; un origen ajeno no recibe el encabezado) | Aprobada |
| `soap.e2e-spec.ts` | Publica el WSDL (XML válido) con las operaciones y la dirección real | Aprobada |
| | Un cliente SOAP construido desde el WSDL ve `ListProducts` y `GetProductById` | Aprobada |
| | `ListProducts` devuelve los productos | Aprobada |
| | `GetProductById` devuelve un producto | Aprobada |
| | `GetProductById` responde SOAP Fault si no existe | Aprobada |
| | Rechaza sobres SOAP de más de 100 KB (413) | Aprobada |
| `rss.e2e-spec.ts` | Genera RSS 2.0 válido con un `item` por producto | Aprobada |
| | Refleja los productos agregados por REST | Aprobada |
| `gateway.e2e-spec.ts` | Consume `ListProducts` del SOAP propio a través del WSDL | Aprobada |
| | Consume `GetProductById` y refleja productos creados por REST | Aprobada |
| | Traduce el SOAP Fault de producto inexistente a 404 | Aprobada |
| | Valida el id antes de llamar al servicio | Aprobada |
| | Consume el RSS propio por HTTP | Aprobada |
| | Valida los parámetros de los servicios externos | Aprobada |
| | Servicio REST inaccesible: 502 `CONNECTION_ERROR` | Aprobada |
| | WSDL que no responde: 504 `TIMEOUT` (tiempo de espera de 500 ms) | Aprobada |
| | RSS con DOCTYPE: 502 `INVALID_RESPONSE` | Aprobada |
| | El backend sigue respondiendo después de los fallos | Aprobada |

Las pruebas de fallos usan un puerto cerrado, un servidor local que nunca responde y un servidor local que devuelve XML con DOCTYPE. No simulan respuestas de los servicios reales; solo reproducen condiciones de red.

## 4. Pruebas manuales con curl

Primero inicie el backend (`pnpm dev` o `pnpm build && pnpm start`). En PowerShell use `curl.exe`.

### REST

```bash
curl -i http://localhost:4000/api/products
curl -i -X POST http://localhost:4000/api/products -H "Content-Type: application/json" -d "{\"name\":\"Mouse inalámbrico\",\"category\":\"Periféricos\",\"price\":349.99}"
curl -i -X POST http://localhost:4000/api/products -H "Content-Type: application/json" -d "{\"name\":\"\",\"price\":-1,\"admin\":true}"
```

Resultado obtenido:

- GET: `HTTP 200` con los 3 productos de ejemplo.
- POST válido: `HTTP 201` con `{"id":4,"name":"Mouse inalámbrico","category":"Periféricos","price":349.99,"description":"",...}`.
- POST inválido: `HTTP 400` con `["property admin should not exist","name should not be empty", ..., "price must not be less than 0.01"]`.

### SOAP y WSDL

```bash
curl "http://localhost:4000/soap/products?wsdl"
curl -X POST http://localhost:4000/soap/products -H "Content-Type: text/xml; charset=utf-8" --data @docs/examples/list-products.xml
curl -X POST http://localhost:4000/soap/products -H "Content-Type: text/xml; charset=utf-8" --data @docs/examples/get-product-by-id.xml
```

Resultado obtenido:

- WSDL: `HTTP 200`, `Content-Type: application/xml`, con `<soap:address location="http://localhost:4000/soap/products"/>`.
- `ListProducts`: `HTTP 200` con `ListProductsResponse` y un `product` por elemento del catálogo.
- `GetProductById` (id 2): `HTTP 200` con `<GetProductByIdResponse ...><product><id>2</id><name>Monitor 24 pulgadas</name>...<price>3499.90</price>...`.
- `GetProductById` (id 99): `HTTP 500` con `<soap:Fault><faultcode>soap:Client</faultcode><faultstring>No existe el producto con id 99</faultstring><detail><code>NOT_FOUND</code></detail></soap:Fault>`.
- La cabecera `SOAPAction` es opcional: node-soap identifica la operación por el elemento del `Body`.

### RSS

```bash
curl -i http://localhost:4000/rss/products.xml
```

Resultado obtenido: `HTTP 200`, `Content-Type: application/rss+xml; charset=utf-8`, documento `<rss version="2.0">` con un `item` por producto. `SyntaxValidator.validate()` de `fast-xml-validator` devolvió `true`.

### Gateway (servicios propios)

```bash
curl http://localhost:4000/api/gateway/soap/products
curl -i http://localhost:4000/api/gateway/soap/products/2
curl -i http://localhost:4000/api/gateway/soap/products/99
curl -i http://localhost:4000/api/gateway/soap/products/abc
curl http://localhost:4000/api/gateway/rss/products
```

Resultado obtenido:

- `soap/products`: `HTTP 200`, `ok: true`, `source: "own-soap"`, 3 productos, `durationMs` cercano a 37 ms en la primera llamada, con `rawRequest` (sobre enviado) y `raw` (sobre recibido).
- `soap/products/2`: `HTTP 200` con el producto 2.
- `soap/products/99`: `HTTP 404`, `error.code: "NOT_FOUND"`, `raw` contiene el `soap:Fault`.
- `soap/products/abc`: `HTTP 400` (validación del gateway, no se llama al servicio).
- `rss/products`: `HTTP 200`, `ok: true`, `source: "own-rss"`, con los elementos del feed.

### Gateway (servicios externos)

```bash
curl -i "http://localhost:4000/api/gateway/external/weather?city=ciudad-de-mexico"
curl -i http://localhost:4000/api/gateway/external/countries/MX
curl -i http://localhost:4000/api/gateway/external/rss
curl -i "http://localhost:4000/api/gateway/external/weather?city=paris"
curl -i http://localhost:4000/api/gateway/external/countries/MEX
```

Resultado obtenido **en el entorno con red bloqueada**:

| Solicitud | Resultado |
|---|---|
| `weather?city=ciudad-de-mexico` | `HTTP 502`, `CONNECTION_ERROR: No se pudo conectar con el servicio (ENOTFOUND)` |
| `countries/MX` | `HTTP 502`, `UPSTREAM_ERROR: No se pudo descargar el WSDL (HTTP 403)` (el proxy del entorno rechazó la conexión) |
| `external/rss` | `HTTP 502`, `CONNECTION_ERROR: No se pudo conectar con el servicio (ENOTFOUND)` |
| `weather?city=paris` | `HTTP 400`, `city debe ser uno de: ciudad-de-mexico, guadalajara, monterrey, bogota, madrid` |
| `countries/MEX` | `HTTP 400`, `iso debe ser un código ISO 3166-1 de dos letras` |

En todos los casos el backend siguió respondiendo con normalidad.

## 5. Pruebas pendientes en un equipo con internet

| Prueba | Resultado esperado | Estado |
|---|---|---|
| `GET /api/gateway/external/weather?city=ciudad-de-mexico` | `HTTP 200`, `ok: true`, temperatura, humedad, viento y código WMO | **Pendiente** |
| `GET /api/gateway/external/countries/MX` | `HTTP 200`, `ok: true`, nombre "Mexico", capital, moneda e idiomas | **Pendiente** |
| `GET /api/gateway/external/countries/ZZ` | `HTTP 404` si el servicio responde "Country not found in the database" | **Pendiente** (comportamiento no confirmado) |
| `GET /api/gateway/external/rss` | `HTTP 200`, `ok: true`, elementos del feed de BBC Mundo | **Pendiente** |

Cuando se ejecuten, anote aquí el resultado real. Si algún servicio cambió o dejó de estar disponible, documente el problema y la alternativa usada (por ejemplo, otro feed RSS mediante `EXTERNAL_RSS_URL`).

## 6. Frontend

Se comprobó con Playwright (Chromium) contra los servidores compilados (`pnpm build` y `pnpm start`), con un `.env` en la raíz que cambiaba `BACKEND_PORT` a 4100 y `PUBLIC_BASE_URL` a `http://localhost:4100`. La página se abrió desde la IP de red del equipo (`http://192.0.2.2:3000`), no desde `localhost`.

| Comprobación | Resultado observado |
|---|---|
| El backend carga el `.env` de la raíz | Log: `Variables de entorno: <raíz>/.env` y `Backend en http://localhost:4100` |
| CORS incluye la IP de red | Log: `CORS: http://localhost:3000, http://127.0.0.1:3000, http://192.0.2.2:3000` |
| El frontend usa el puerto del `.env` y el host de la página | Todas las solicitudes del navegador fueron a `http://192.0.2.2:4100` |
| Errores en la consola del navegador | Ninguno, aparte de los 400, 404 y 502 provocados a propósito |
| `/rest` | Tabla con los productos, alta de producto con `HTTP 201` |
| `/soap` | `ListProducts` con el sobre SOAP enviado; `GetProductById` con id 99 muestra `HTTP 404` y `NOT_FOUND` |
| `/rss` | Lista de elementos del feed propio |
| `/external` | Errores controlados `HTTP 502` (red bloqueada en el entorno de pruebas) |
| Desplazamiento horizontal con el XML abierto | No hay, ni en 1280 px ni en 390 px de ancho |

### Modo desarrollo desde la red local

Con `pnpm dev` y la página abierta desde la IP de red:

- El handshake de `/_next/hmr` con `Origin: http://192.0.2.2:3000` respondió `101 Switching Protocols` (antes del cambio, Next.js lo bloqueaba con el aviso `Blocked cross-origin request`).
- Un origen ajeno (`evil.example`) siguió bloqueado, como se espera.
- En el entorno de pruebas, Chromium no pudo abrir **ningún** WebSocket hacia esa IP, ni siquiera hacia un servidor de prueba independiente de Next.js. Es una limitación de ese contenedor; por eso la recarga en caliente desde la IP de red debe confirmarse en un equipo normal.
