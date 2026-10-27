'use client';

import type { CreateProductInput, Product } from '@wslab/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { BackendUrl } from '@/components/BackendLink';
import { ProductTable } from '@/components/ProductTable';
import { RawView } from '@/components/RawView';
import { StatusChip } from '@/components/StatusChip';
import { validationMessages } from '@/lib/api';
import { useRequest } from '@/lib/use-request';

const EMPTY_FORM = { name: '', category: '', price: '', description: '' };

export function RestDemo() {
  const list = useRequest<Product[]>();
  const create = useRequest<Product>();
  const [form, setForm] = useState(EMPTY_FORM);
  const { run: runList } = list;

  useEffect(() => {
    void runList('/api/products');
  }, [runList]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: CreateProductInput = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      ...(form.description ? { description: form.description } : {}),
    };
    const res = await create.run('/api/products', { method: 'POST', body: JSON.stringify(payload) });
    if (res.status === 201) {
      setForm(EMPTY_FORM);
      await runList('/api/products');
    }
  }

  const products = Array.isArray(list.response?.body) ? list.response.body : [];
  const createErrors =
    create.response && create.response.status !== 201 ? validationMessages(create.response.body) : [];

  return (
    <>
      <section className="card">
        <div className="card-head">
          <div className="card-title">
            <span className="chip">GET</span>
            <h2 className="subhead">Consultar productos</h2>
          </div>
          <button
            type="button"
            className="btn secondary"
            onClick={() => runList('/api/products')}
            disabled={list.loading}
          >
            Volver a consultar
          </button>
        </div>
        <p className="caption">
          <BackendUrl path="/api/products" />
        </p>
        {list.response?.networkError && (
          <div className="alert error" role="alert">
            <strong>Sin conexión</strong>
            <div>{list.response.networkError}</div>
          </div>
        )}
        {list.response && !list.response.networkError && (
          <p className="caption">
            <StatusChip status={list.response.status} /> {products.length} productos
          </p>
        )}
        <ProductTable products={products} />
        <div className="raw-list">
          <RawView label="respuesta JSON" content={list.response?.rawText} />
        </div>
      </section>

      <section className="card">
        <div className="card-title">
          <span className="chip">POST</span>
          <h2 className="subhead">Agregar producto</h2>
        </div>
        <p className="small muted">
          El backend valida los datos: nombre y categoría obligatorios, precio entre 0.01 y 1,000,000 y sin
          propiedades adicionales. Los datos solo se guardan en memoria.
        </p>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                value={form.name}
                placeholder="Mouse inalámbrico"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="category">Categoría</label>
              <input
                id="category"
                value={form.category}
                placeholder="Periféricos"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="price">Precio</label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                placeholder="349.99"
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="field grow">
              <label htmlFor="description">Descripción (opcional)</label>
              <input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn" disabled={create.loading}>
              Agregar
            </button>
          </div>
        </form>

        {create.response?.networkError && (
          <div className="alert error" role="alert">
            <strong>Sin conexión</strong>
            <div>{create.response.networkError}</div>
          </div>
        )}
        {create.response?.status === 201 && (
          <div className="alert success" role="status">
            <strong>HTTP 201</strong>
            <div>Producto creado con id {create.response.body?.id}.</div>
          </div>
        )}
        {createErrors.length > 0 && (
          <div className="alert error" role="alert">
            <strong>HTTP {create.response?.status}</strong>
            <ul>
              {createErrors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="raw-list">
          <RawView label="respuesta JSON" content={create.response?.rawText} />
        </div>
      </section>
    </>
  );
}
