'use client';

import type { GatewayResult, Product } from '@wslab/shared';
import { useState } from 'react';
import { GatewayResultView } from '@/components/GatewayResultView';
import { ProductTable } from '@/components/ProductTable';
import { useRequest } from '@/lib/use-request';

export function SoapDemo() {
  const list = useRequest<GatewayResult<Product[]>>();
  const byId = useRequest<GatewayResult<Product>>();
  const [id, setId] = useState('1');

  return (
    <>
      <section className="card">
        <div className="card-title">
          <span className="chip">SOAP</span>
          <h2 className="subhead">ListProducts</h2>
        </div>
        <div className="form-row">
          <button
            type="button"
            className="btn"
            onClick={() => list.run('/api/gateway/soap/products')}
            disabled={list.loading}
          >
            Ejecutar ListProducts
          </button>
        </div>
        <GatewayResultView response={list.response} loading={list.loading}>
          {(products) => <ProductTable products={products} />}
        </GatewayResultView>
      </section>

      <section className="card">
        <div className="card-title">
          <span className="chip">SOAP</span>
          <h2 className="subhead">GetProductById</h2>
        </div>
        <p className="small muted">Pruebe con un id inexistente, por ejemplo 99, para ver un SOAP Fault.</p>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            void byId.run(`/api/gateway/soap/products/${encodeURIComponent(id)}`);
          }}
        >
          <div className="field">
            <label htmlFor="product-id">ID del producto</label>
            <input id="product-id" type="number" min={1} value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <button type="submit" className="btn" disabled={byId.loading}>
            Ejecutar GetProductById
          </button>
        </form>
        <GatewayResultView response={byId.response} loading={byId.loading}>
          {(product) => <ProductTable products={[product]} />}
        </GatewayResultView>
      </section>
    </>
  );
}
