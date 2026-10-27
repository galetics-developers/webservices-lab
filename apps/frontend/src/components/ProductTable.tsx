import type { Product } from '@wslab/shared';
import { currency } from '@/lib/format';

export function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) return <p className="caption">Sin productos.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th className="num">Precio</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="num" style={{ textAlign: 'left' }}>
                {p.id}
              </td>
              <td>
                <strong>{p.name}</strong>
              </td>
              <td>{p.category}</td>
              <td className="num">{currency.format(p.price)}</td>
              <td className="muted">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
