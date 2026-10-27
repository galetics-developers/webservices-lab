import { PageHeader } from '@/components/PageHeader';
import { RestDemo } from './RestDemo';

export default function RestPage() {
  return (
    <>
      <PageHeader overline="Servicio propio" title="REST/JSON">
        Servicio publicado con NestJS. Usa recursos y métodos HTTP (GET y POST /api/products) e
        intercambia los datos en JSON.
      </PageHeader>
      <RestDemo />
    </>
  );
}
