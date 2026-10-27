import { Inject, Injectable } from '@nestjs/common';
import type { GatewayResult, RssFeed, ServiceSource } from '@wslab/shared';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { RSS_PATH } from '../rss/rss.controller.js';
import { execute } from './execute.js';
import { fetchText } from './http-text.js';
import { parseRss } from './rss-parser.js';

@Injectable()
export class RssClient {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  readOwnFeed(): Promise<GatewayResult<RssFeed>> {
    return this.read('own-rss', `${this.config.publicBaseUrl}${RSS_PATH}`);
  }

  readExternalFeed(): Promise<GatewayResult<RssFeed>> {
    return this.read('external-rss', this.config.externalRssUrl);
  }

  private read(source: ServiceSource, url: string): Promise<GatewayResult<RssFeed>> {
    return execute(source, 'RSS', url, async (trace) => {
      const response = await fetchText(url, {
        timeoutMs: this.config.httpTimeoutMs,
        accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8',
      });
      trace.raw = response.body;
      return { data: parseRss(response.body), raw: response.body };
    });
  }
}
