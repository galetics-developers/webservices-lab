import { BackendLink } from '@/components/BackendLink';
import { PageHeader } from '@/components/PageHeader';
import { RssDemo } from './RssDemo';

export default function RssPage() {
  return (
    <>
      <PageHeader overline="Servicio propio" title="RSS/XML">
        Feed RSS 2.0 propio. El gateway lo descarga por HTTP, analiza el XML y entrega los elementos en
        JSON.
      </PageHeader>
      <p className="small">
        <span className="label">Feed: </span>
        <BackendLink path="/rss/products.xml" />
      </p>
      <RssDemo />
    </>
  );
}
