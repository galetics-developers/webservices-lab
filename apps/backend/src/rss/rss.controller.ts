import { Controller, Get, Header, Inject } from '@nestjs/common';
import { Feed } from 'feed';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { ProductsService } from '../products/products.service.js';

export const RSS_PATH = '/rss/products.xml';

@Controller()
export class RssController {
  constructor(
    private readonly products: ProductsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get(RSS_PATH)
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  getFeed(): string {
    const base = this.config.publicBaseUrl;
    const items = this.products.findAll();

    const feed = new Feed({
      title: 'webservices-lab: productos de ejemplo',
      id: `${base}${RSS_PATH}`,
      link: `${base}/api/products`,
      description: 'Feed RSS generado a partir del catálogo de ejemplo en memoria.',
      language: 'es',
      copyright: 'Datos de ejemplo para una práctica académica',
      updated: items.length ? new Date(items[items.length - 1].createdAt) : new Date(),
      generator: 'webservices-lab (feed)',
      feedLinks: { rss: `${base}${RSS_PATH}` },
    });

    for (const p of items) {
      feed.addItem({
        title: p.name,
        id: `product-${p.id}`,
        guid: `product-${p.id}`,
        link: `${base}/api/products`,
        description: `${p.description} Precio: $${p.price.toFixed(2)}`.trim(),
        date: new Date(p.createdAt),
        category: [{ name: p.category }],
      });
    }

    return feed.rss2();
  }
}
