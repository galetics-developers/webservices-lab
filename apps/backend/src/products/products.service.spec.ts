import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    service = new ProductsService();
  });

  it('inicia con los productos de ejemplo', () => {
    expect(service.findAll()).toHaveLength(3);
    expect(service.findById(1)?.name).toBe('Teclado mecánico');
  });

  it('agrega productos con id incremental', () => {
    const created = service.create({ name: 'Mouse', category: 'Periféricos', price: 250 });
    expect(created.id).toBe(4);
    expect(created.description).toBe('');
    expect(service.findAll()).toHaveLength(4);
  });

  it('devuelve copias para que el catálogo no se modifique desde fuera', () => {
    service.findAll()[0].name = 'cambiado';
    expect(service.findById(1)?.name).toBe('Teclado mecánico');
  });

  it('devuelve undefined si el producto no existe', () => {
    expect(service.findById(999)).toBeUndefined();
  });
});
