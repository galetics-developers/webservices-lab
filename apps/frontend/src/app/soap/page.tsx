import { BackendLink } from '@/components/BackendLink';
import { PageHeader } from '@/components/PageHeader';
import { SoapDemo } from './SoapDemo';

export default function SoapPage() {
  return (
    <>
      <PageHeader overline="Servicio propio" title="SOAP/WSDL">
        Servicio descrito por un WSDL. El gateway crea un cliente SOAP a partir de ese contrato, envía un
        sobre XML y devuelve el resultado en JSON.
      </PageHeader>
      <p className="small">
        <span className="label">WSDL: </span>
        <BackendLink path="/soap/products?wsdl" />
      </p>
      <SoapDemo />
    </>
  );
}
