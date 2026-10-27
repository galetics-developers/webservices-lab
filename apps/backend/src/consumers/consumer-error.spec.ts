import { ConsumerError, toConsumerError } from './consumer-error.js';

describe('toConsumerError', () => {
  it('detecta tiempos de espera de fetch y de axios', () => {
    expect(toConsumerError(new DOMException('t', 'TimeoutError')).code).toBe('TIMEOUT');
    expect(toConsumerError({ code: 'ECONNABORTED', message: 'timeout' }).code).toBe('TIMEOUT');
  });

  it('detecta errores de conexión', () => {
    const fetchError = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    expect(toConsumerError(fetchError).code).toBe('CONNECTION_ERROR');
    expect(toConsumerError({ code: 'ENOTFOUND' }).code).toBe('CONNECTION_ERROR');
  });

  it('traduce SOAP Fault y distingue NOT_FOUND', () => {
    const fault = (code: string) => ({
      root: { Envelope: { Body: { Fault: { faultcode: 'soap:Client', faultstring: 'x', detail: { code } } } } },
    });
    expect(toConsumerError(fault('NOT_FOUND')).code).toBe('NOT_FOUND');
    expect(toConsumerError(fault('INVALID_ID')).code).toBe('SOAP_FAULT');
  });

  it('resume el error de descarga del WSDL', () => {
    const err = new Error('Invalid WSDL URL: https://x/?WSDL\n\n\r Code: 403\n\n\r Response Body: bloqueado');
    expect(toConsumerError(err)).toMatchObject({
      code: 'UPSTREAM_ERROR',
      message: 'No se pudo descargar el WSDL (HTTP 403)',
    });
  });

  it('conserva los ConsumerError existentes', () => {
    const original = new ConsumerError('INVALID_RESPONSE', 'mal');
    expect(toConsumerError(original)).toBe(original);
  });
});
