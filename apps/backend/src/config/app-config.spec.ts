import { loadConfig } from './app-config.js';

describe('loadConfig', () => {
  it('usa valores por defecto cuando no hay variables', () => {
    const config = loadConfig({}, { detectLocalNetwork: false });
    expect(config.port).toBe(4000);
    expect(config.publicBaseUrl).toBe('http://localhost:4000');
    expect(config.frontendOrigins).toEqual(['http://localhost:3000']);
  });

  it('agrega localhost, 127.0.0.1 y las IP de la red local como orígenes permitidos', () => {
    const origins = loadConfig({}).frontendOrigins;
    expect(origins).toContain('http://localhost:3000');
    expect(origins).toContain('http://127.0.0.1:3000');
  });

  it('acepta orígenes adicionales separados por comas', () => {
    const config = loadConfig(
      { FRONTEND_EXTRA_ORIGINS: 'http://192.168.1.8:3000, https://demo.example.com/' },
      { detectLocalNetwork: false },
    );
    expect(config.frontendOrigins).toEqual([
      'http://localhost:3000',
      'http://192.168.1.8:3000',
      'https://demo.example.com',
    ]);
  });

  it('acepta a la vez el dominio propio y el dominio gratuito de Cloudflare', () => {
    const config = loadConfig(
      { FRONTEND_EXTRA_ORIGINS: 'https://wslab.galetics.lat/,https://wslab.2302073.workers.dev/' },
      { detectLocalNetwork: false },
    );
    expect(config.frontendOrigins).toEqual([
      'http://localhost:3000',
      'https://wslab.galetics.lat',
      'https://wslab.2302073.workers.dev',
    ]);
  });

  it('quita la barra final de PUBLIC_BASE_URL', () => {
    expect(loadConfig({ PUBLIC_BASE_URL: 'http://127.0.0.1:5000/' }).publicBaseUrl).toBe(
      'http://127.0.0.1:5000',
    );
  });

  it('rechaza URLs inválidas o con protocolos no permitidos', () => {
    expect(() => loadConfig({ EXTERNAL_RSS_URL: 'no-es-url' })).toThrow(/EXTERNAL_RSS_URL/);
    expect(() => loadConfig({ EXTERNAL_RSS_URL: 'file:///etc/passwd' })).toThrow(/http o https/);
    expect(() => loadConfig({ FRONTEND_EXTRA_ORIGINS: 'ftp://x' })).toThrow(/FRONTEND_EXTRA_ORIGINS/);
  });

  it('valida el rango del tiempo de espera', () => {
    expect(() => loadConfig({ HTTP_TIMEOUT_MS: '0' })).toThrow(/HTTP_TIMEOUT_MS/);
  });
});