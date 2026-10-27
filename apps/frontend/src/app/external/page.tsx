import { PageHeader } from '@/components/PageHeader';
import { ExternalDemo } from './ExternalDemo';

export default function ExternalPage() {
  return (
    <>
      <PageHeader overline="Servicios de terceros" title="Servicios externos">
        El backend consume servicios de terceros con URLs fijas en su configuración. Solo se eligen
        parámetros validados y, si un servicio falla, el gateway devuelve el error sin afectar al resto de
        la aplicación.
      </PageHeader>
      <ExternalDemo />
    </>
  );
}
