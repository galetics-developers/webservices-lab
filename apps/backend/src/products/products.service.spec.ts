import { ProductsService } from './products.service.js';

const SEED_SIZE = 15;

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    service = new ProductsService();
  });

  it('inicia con los productos de ejemplo de ferretería industrial', () => {
    expect(service.findAll()).toHaveLength(SEED_SIZE);
    expect(service.findById(1)?.name).toBe('Taladro magnético de base 1200 W');
    expect(service.findById(SEED_SIZE)?.name).toBe('Grasa de litio EP2 (cubeta de 19 kg)');
  });

  it('usa nombres e ids únicos en el catálogo de ejemplo', () => {
    const products = service.findAll();
    expect(new Set(products.map((p) => p.id)).size).toBe(SEED_SIZE);
    expect(new Set(products.map((p) => p.name)).size).toBe(SEED_SIZE);
  });

  it('cumple las mismas reglas que valida POST /api/products', () => {
    for (const p of service.findAll()) {
      expect(p.name.length).toBeLessThanOrEqual(80);
      expect(p.category.length).toBeLessThanOrEqual(40);
      expect(p.description.length).toBeLessThanOrEqual(300);
      expect(p.price).toBeGreaterThanOrEqual(0.01);
      expect(p.price).toBeLessThanOrEqual(1_000_000);
      expect(Math.round(p.price * 100) / 100).toBe(p.price);
    }
  });

  it('agrega productos con id incremental', () => {
    const created = service.create({
      name: 'Llave de impacto neumática 1/2 pulg',
      category: 'Herramienta neumática',
      price: 4890,
    });
    expect(created.id).toBe(SEED_SIZE + 1);
    expect(created.description).toBe('');
    expect(service.findAll()).toHaveLength(SEED_SIZE + 1);
  });

  it('devuelve copias para que el catálogo no se modifique desde fuera', () => {
    service.findAll()[0].name = 'cambiado';
    expect(service.findById(1)?.name).toBe('Taladro magnético de base 1200 W');
  });

  it('devuelve undefined si el producto no existe', () => {
    expect(service.findById(999)).toBeUndefined();
  });
});