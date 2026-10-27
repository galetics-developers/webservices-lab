'use client';

import type { GatewayResult, RssFeed } from '@wslab/shared';
import { GatewayResultView } from '@/components/GatewayResultView';
import { RssItems } from '@/components/RssItems';
import { useRequest } from '@/lib/use-request';

export function RssDemo() {
  const feed = useRequest<GatewayResult<RssFeed>>();

  return (
    <section className="card">
      <div className="card-title">
        <span className="chip">RSS</span>
        <h2 className="subhead">Leer el feed propio</h2>
      </div>
      <div className="form-row">
        <button
          type="button"
          className="btn"
          onClick={() => feed.run('/api/gateway/rss/products')}
          disabled={feed.loading}
        >
          Leer feed
        </button>
      </div>
      <GatewayResultView response={feed.response} loading={feed.loading}>
        {(data) => <RssItems feed={data} />}
      </GatewayResultView>
    </section>
  );
}
