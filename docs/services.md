# Servicios publicados y consumidos

## Conceptos

| Concepto | Descripción breve | Dónde se ve en el proyecto |
|---|---|---|
| **Servicio web** | Funcionalidad expuesta por HTTP para que otro programa la use, sin importar su lenguaje | Los tres servicios propios y los tres externos |
| **REST** | Estilo de arquitectura basado en recursos (URLs) y métodos HTTP (`GET`, `POST`...). No define un formato obligatorio; aquí se usa JSON | `GET/POST /api/products`, Open-Meteo |
| **XML** | Lenguaje de marcado para representar datos estructurados con etiquetas y espacios de nombres | Sobres SOAP, WSDL y RSS |
| **SOAP** | Protocolo de mensajería: cada solicitud y respuesta es un sobre XML (`Envelope` con `Body` y opcionalmente `Header`); los errores se informan con `Fault` | `/soap/products`, CountryInfoService |
| **WSDL** | Documento XML que describe un servicio SOAP: tipos (XSD), mensajes, operaciones (`portType`), formato (`binding`) y dirección (`service`) | `apps/backend/src/soap/products.wsdl` |
| **RSS** | Formato XML para publicar una lista de elementos (`channel` con varios `item`) que un lector puede consultar periódicamente | `/rss/products.xml`, feed público |

## 1. Servicio REST/JSON propio

**Publicación** (`apps/backend/src/rest/`)

| Método | Ruta | Cuerpo | Respuestas |
|---|---|---|---|
| GET | `/api/products` | | `200` con un arreglo de productos |
| POST | `/api/products` | `{ "name", "category", "price", "description?" }` | `201` producto creado; `400` con la lista de errores de validación |

- `CreateProductDto` usa `class-validator`: textos obligatorios con longitud máxima, `price` entre 0.01 y 1,000,000 con dos decimales como máximo.
- `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`: cualquier propiedad no declarada se rechaza.
- Los datos solo existen en memoria y se reinician con el servidor.

**Consumo**: el frontend lo consume directamente por JSON en la página REST.

## 2. Servicio SOAP/WSDL propio

**Publicación** (`apps/backend/src/soap/`)

- WSDL 1.1, estilo **document/literal**, espacio de nombres `http://wslab.local/products`.
- Dirección: `POST /soap/products`. Descripción: `GET /soap/products?wsdl`.
- La etiqueta `soap:address` se completa al arrancar con `PUBLIC_BASE_URL`.

| Operación | Elemento de entrada | Elemento de salida | Error |
|---|---|---|---|
| `ListProducts` | `ListProductsRequest` (vacío) | `ListProductsResponse` con 0..n `product` | |
| `GetProductById` | `GetProductByIdRequest` con `id` (`xsd:int`) | `GetProductByIdResponse` con un `product` | `soap:Fault` con `faultcode=soap:Client` y `detail/code` = `NOT_FOUND` o `INVALID_ID` |

El tipo `Product` del esquema tiene `id` (`xsd:int`), `name`, `category`, `price` (`xsd:decimal`), `description` y `createdAt` (`xsd:dateTime`).

Implementación: `ProductsSoapService.buildServiceDefinition()` devuelve un objeto `{ ProductsService: { ProductsPort: { ListProducts, GetProductById } } }` cuyos nombres coinciden con `service`, `port` y `operation` del WSDL. `soap.listen()` lo registra sobre la instancia Express de NestJS.

Medidas: los SOAP Fault no incluyen trazas internas (`suppressStack`) y se rechazan los sobres de más de 100 KB (HTTP 413) cuando declaran `Content-Length`.

Ejemplo de solicitud (`docs/examples/get-product-by-id.xml`):

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="http://wslab.local/products">
  <soap:Body>
    <p:GetProductByIdRequest><p:id>2</p:id></p:GetProductByIdRequest>
  </soap:Body>
</soap:Envelope>
```

**Consumo** (`apps/backend/src/consumers/own-soap.client.ts`)

1. `soap.createClientAsync('<PUBLIC_BASE_URL>/soap/products?wsdl')` descarga el WSDL y genera los métodos `ListProductsAsync` y `GetProductByIdAsync`.
2. La llamada devuelve el resultado convertido a objeto, el XML recibido y el XML enviado. node-soap convierte `xsd:int` y `xsd:decimal` a números usando el esquema.
3. El cliente valida que cada producto tenga `id` entero, `name` y `price` numérico.
4. Un SOAP Fault con `detail/code = NOT_FOUND` se traduce a HTTP 404 en el gateway.

## 3. Feed RSS/XML propio

**Publicación** (`apps/backend/src/rss/`)

- `GET /rss/products.xml` con `Content-Type: application/rss+xml; charset=utf-8`.
- Se genera con la biblioteca `feed` (RSS 2.0): un `item` por producto con `title`, `guid`, `pubDate`, `description` y `category`.

**Consumo** (`apps/backend/src/consumers/rss.client.ts` y `rss-parser.ts`)

1. `fetch` con `AbortSignal.timeout()` y lectura por partes con límite de 1 MB.
2. Se rechaza cualquier documento con `<!DOCTYPE` o `<!ENTITY>` para evitar XXE y la expansión exponencial de entidades.
3. `fast-xml-parser` convierte el XML (solo entidades XML estándar, sin entidades HTML).
4. Se valida la estructura `rss/channel/title` y se devuelven como máximo 20 elementos, con textos recortados a 500 caracteres.

## 4. Servicios externos

Las URLs se configuran en el backend (`.env`) y el usuario nunca puede indicar otra URL.

### Open-Meteo (REST/JSON)

- Documentación: <https://open-meteo.com/en/docs>. No requiere clave de acceso.
- Solicitud: `GET https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`.
- El usuario solo elige una ciudad de una lista fija (`WEATHER_CITIES`); el backend conoce sus coordenadas.
- Se valida que `current.time` sea texto y que los cuatro valores sean numéricos.
- Limitaciones: servicio gratuito para uso no comercial, con límite de solicitudes diario.

### CountryInfoService (SOAP/WSDL)

- WSDL: `https://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL`.
- Operación usada: `FullCountryInfo`, parámetro `sCountryISOCode` (dos letras, validado en el gateway).
- El cliente se construye con el WSDL real. Se fija la dirección del servicio (`COUNTRY_INFO_ENDPOINT`) en HTTPS para no depender de la dirección publicada en el WSDL.
- Se extraen `sName`, `sCapitalCity`, `sPhoneCode`, `sContinentCode`, `sCurrencyISOCode`, `sCountryFlag` y `Languages/tLanguage`.
- Si la respuesta indica que el país no existe (texto "not found"), el gateway responde 404.
- Limitación: los nombres de los campos y el comportamiento ante códigos inexistentes **no se pudieron comprobar en el entorno de desarrollo** (ver `docs/testing.md`). Deben confirmarse en la primera ejecución con acceso a internet.

### Feed RSS público

- Por defecto, BBC News Mundo: `https://feeds.bbci.co.uk/mundo/rss.xml`. Se cambia con `EXTERNAL_RSS_URL`.
- Se procesa con el mismo lector seguro que el RSS propio.

## 5. Gateway JSON

| Ruta | Cliente | Servicio consumido |
|---|---|---|
| `GET /api/gateway/soap/products` | OwnSoapClient | SOAP propio, `ListProducts` |
| `GET /api/gateway/soap/products/:id` | OwnSoapClient | SOAP propio, `GetProductById` |
| `GET /api/gateway/rss/products` | RssClient | RSS propio |
| `GET /api/gateway/external/weather?city=` | OpenMeteoClient | Open-Meteo |
| `GET /api/gateway/external/countries/:iso` | CountryInfoClient | CountryInfoService |
| `GET /api/gateway/external/rss` | RssClient | Feed RSS público |

Todas las rutas devuelven `GatewayResult` (ver `docs/architecture.md`).

## 6. Seguridad aplicada

| Medida | Implementación |
|---|---|
| Validación de entradas | DTO con `class-validator`, `whitelist` y `forbidNonWhitelisted`; id entero positivo; ciudad de una lista; ISO de dos letras |
| Sin URLs del usuario (SSRF) | Las URLs externas vienen de la configuración, validada al arrancar (solo `http` o `https`) |
| Tiempos de espera | `fetch` con `AbortSignal.timeout`; node-soap con la opción `timeout` al descargar el WSDL y al invocar operaciones |
| Límite de tamaño | 1 MB en respuestas externas; 100 KB en sobres SOAP entrantes |
| XML seguro | Rechazo de `DOCTYPE`/`ENTITY` en RSS; sin entidades HTML; validación de la estructura |
| Validación de respuestas | Cada cliente comprueba los campos esperados antes de devolver `ok: true` |
| TLS | No se desactiva la verificación de certificados; los servicios externos se consumen por HTTPS |
| CORS | Solo se permiten `localhost`, `127.0.0.1` y las IP de la red local del equipo en el puerto 3000, más `FRONTEND_EXTRA_ORIGINS`, con los métodos `GET` y `POST`. Cualquier otro origen no recibe el encabezado `Access-Control-Allow-Origin` |
| Secretos | No se necesitan credenciales; los `.env` están en `.gitignore` y solo se versiona `.env.example` |
| Encabezados | Se desactiva `X-Powered-By` en backend y frontend |
