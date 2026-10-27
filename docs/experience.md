# Guía para explicar la experiencia

Esta guía resume lo que se implementó y lo que ocurrió realmente durante el desarrollo. Sirve como base para la presentación; complétela con su propia experiencia al ejecutar el proyecto (en especial, la sección 3.2).

## 1. ¿Qué servicio web se implementó?

Un backend NestJS que publica el mismo catálogo de ejemplo con tres tecnologías:

- **REST/JSON**: `GET` y `POST /api/products`, con validación de datos y códigos HTTP adecuados (200, 201, 400).
- **SOAP/WSDL**: `/soap/products`, descrito por un WSDL propio (document/literal) con las operaciones `ListProducts` y `GetProductById`. Los errores se devuelven como `soap:Fault`.
- **RSS/XML**: `/rss/products.xml`, un feed RSS 2.0 generado con la biblioteca `feed`.

Punto para explicar: los tres comparten los mismos datos. Si se agrega un producto por REST, aparece en SOAP y en RSS. Así se ve que el protocolo es la forma de exponer la información, no la información misma.

## 2. ¿Qué servicios externos se consumieron?

| Servicio | Protocolo | Para qué |
|---|---|---|
| Open-Meteo | REST/JSON | Clima actual de una ciudad |
| CountryInfoService | SOAP/WSDL | Datos de un país por código ISO |
| BBC News Mundo | RSS/XML | Últimas noticias de un feed público |

Además, el backend consume **sus propios** servicios SOAP y RSS mediante HTTP, igual que lo haría cualquier cliente externo.

## 3. ¿Cómo funcionaron las integraciones?

### 3.1 Comprobado durante el desarrollo

- El cliente SOAP (`node-soap`) descarga el WSDL propio, genera los métodos `ListProductsAsync` y `GetProductByIdAsync` y envía sobres XML reales. La interfaz muestra el sobre enviado y el recibido.
- El SOAP Fault de un producto inexistente llega al cliente y el gateway lo convierte en HTTP 404.
- El RSS propio se descarga por HTTP, se valida como XML y se transforma en JSON.
- Ante fallos (puerto cerrado, servidor que no responde, XML con DOCTYPE) el gateway responde con un error claro (502 o 504) y el resto del backend sigue funcionando. Así lo confirmaron 23 pruebas e2e.

### 3.2 Pendiente de comprobar

En el entorno de desarrollo la red bloqueaba los servicios externos, así que **no se obtuvieron respuestas reales** de Open-Meteo, CountryInfoService ni BBC Mundo. Al ejecutar el proyecto en un equipo con internet, anote:

- Si cada servicio respondió y cuánto tardó (la interfaz muestra la duración).
- Qué devolvió CountryInfoService para un código inexistente (por ejemplo `ZZ`).
- Cualquier diferencia entre lo documentado y lo observado.

## 4. Dificultades encontradas y cómo se resolvieron

Estas dificultades ocurrieron realmente durante el desarrollo:

| Dificultad | Causa | Solución |
|---|---|---|
| Los servicios externos no respondían (`ENOTFOUND`, `HTTP 403`) | La política de red del entorno de desarrollo solo permitía el registro de npm | Se implementaron los clientes con manejo de errores y tiempos de espera, se probaron los fallos con servidores locales y se dejaron documentadas las pruebas pendientes. No se simularon respuestas |
| NestJS 12 se distribuye solo como ESM | Cambio de versión mayor de NestJS | Se usó como base el proyecto que genera el CLI oficial: `"type": "module"`, imports con extensión `.js` y Vitest en lugar de Jest |
| TypeScript 7 no era compatible | `@nestjs/cli` 12 declara `typescript ~6.0` | Se fijó TypeScript 6.0.3 en los tres paquetes |
| La ruta SOAP podía quedar detrás del manejador 404 de NestJS | `soap.listen()` registra la ruta en Express de forma asíncrona | `setupApp()` espera a que node-soap termine de registrar la ruta antes de `app.init()` |
| El WSDL publicado mostraba `{{SERVICE_URL}}` en lugar de la dirección | `String.replace` solo sustituyó la primera aparición, que estaba en un comentario | Se cambió a `replaceAll` y se quitó el marcador del comentario. Se detectó al consultar el WSDL con curl |
| Una prueba esperaba el precio como texto `"3499.90"` | node-soap convierte `xsd:decimal` y `xsd:int` en números usando el esquema del WSDL | Se corrigió la prueba; el cliente propio acepta ambos formatos |
| Una prueba de CORS esperaba que no se enviara el encabezado para otros orígenes | Con un origen fijo, el paquete `cors` siempre envía ese origen y es el navegador quien bloquea | Se ajustó la prueba para verificar que nunca se refleja un origen no autorizado |
| El error al descargar el WSDL incluía el cuerpo completo de la respuesta HTTP | Formato del mensaje de error de node-soap | Se resume como `No se pudo descargar el WSDL (HTTP 403)` |
| `next/font/google` necesita descargar fuentes al compilar | Sin acceso a Google Fonts en el entorno | Las fuentes del diseño (Archivo Black, Work Sans y Space Mono) se incluyen con paquetes `@fontsource`, que se instalan desde npm |
| Al abrir el frontend desde la IP de la red local (`192.168.1.8`), Next.js bloqueó `/_next/hmr` | Next.js 16 solo permite por defecto sus recursos de desarrollo desde `localhost` | `next.config.ts` agrega a `allowedDevOrigins` las IP de la red local del equipo. El backend también las acepta en CORS y el frontend calcula la URL del backend a partir del host de la página |
| Las variables de entorno estaban repartidas en `apps/backend/.env` y `apps/frontend/.env.local` | Cada aplicación busca su `.env` en su propia carpeta | Se usa un único `.env` en la raíz. El backend lo carga con `process.loadEnvFile` y el frontend lo lee en `next.config.ts` con `util.parseEnv` |
| `next dev` generaba `apps/frontend/AGENTS.md` | Next.js 16 crea ese archivo cuando detecta un agente de programación | Se desactivó con `agentRules: false` en `next.config.ts` |
| pnpm 10 avisa de scripts de instalación bloqueados | pnpm 10 no ejecuta scripts de dependencias sin autorización | Se declararon en `ignoredBuiltDependencies`, porque ninguno es necesario |

Una diferencia técnica que conviene mencionar: `fetch` de Node.js no usa las variables de proxy del sistema, mientras que node-soap (que usa axios) sí. Por eso, en el mismo entorno, los errores fueron distintos: `ENOTFOUND` con `fetch` y `HTTP 403` del proxy con SOAP.

## 5. ¿Qué se aprendió?

Puntos que se pueden explicar con el proyecto:

- **REST y SOAP resuelven el mismo problema de forma distinta.** REST usa URLs y métodos HTTP con JSON libre; SOAP define un contrato formal (WSDL) y mensajes XML con estructura fija.
- **El WSDL permite generar el cliente automáticamente.** El cliente SOAP no se programa a mano: se crea a partir del contrato y sabe qué operaciones y tipos existen.
- **RSS es XML con una estructura acordada** (`channel` e `item`), pensada para que cualquier lector lo interprete.
- **Consumir servicios de terceros implica aceptar que pueden fallar.** Se necesitan tiempos de espera, validación de las respuestas y mensajes de error claros para que la aplicación no se caiga.
- **Procesar XML externo tiene riesgos** (XXE, expansión de entidades). Se mitigan rechazando DOCTYPE y limitando el tamaño.
- **No hay que aceptar URLs del usuario** para hacer solicitudes desde el servidor (SSRF).
- **Un monorepo con pnpm workspaces** permite compartir tipos entre backend y frontend (`@wslab/shared`) y ejecutar todo con un solo comando.

## 6. Guion sugerido para la demostración (5 a 8 minutos)

1. Mostrar la estructura del monorepo y ejecutar `pnpm dev`.
2. **REST**: abrir `/rest`, agregar un producto y provocar un error de validación.
3. **WSDL**: abrir `http://localhost:4000/soap/products?wsdl` y señalar `types`, `portType`, `binding` y `service`.
4. **SOAP**: en `/soap`, ejecutar `ListProducts` y mostrar el sobre enviado y recibido; luego `GetProductById` con id 99 para ver el SOAP Fault.
5. **RSS**: abrir `http://localhost:4000/rss/products.xml` y después `/rss` para ver cómo se consume.
6. **Externos**: en `/external`, consultar el clima, un país y el feed público.
7. Mostrar `pnpm test` y comentar las dificultades de la sección 4.
