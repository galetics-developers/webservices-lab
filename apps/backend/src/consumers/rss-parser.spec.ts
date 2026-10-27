import { ConsumerError } from './consumer-error.js';
import { parseRss } from './rss-parser.js';

const VALID = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Feed &amp; pruebas</title>
    <link>https://example.org/</link>
    <description>Descripción</description>
    <item>
      <title><![CDATA[Primer elemento]]></title>
      <link>https://example.org/1</link>
      <description>Texto &lt;b&gt;uno&lt;/b&gt;</description>
      <pubDate>Tue, 27 Oct 2026 10:00:00 GMT</pubDate>
      <guid isPermaLink="false">uno</guid>
      <category>General</category>
    </item>
    <item>
      <title>Segundo elemento</title>
      <link>https://example.org/2</link>
    </item>
  </channel>
</rss>`;

describe('parseRss', () => {
  it('convierte un RSS 2.0 válido', () => {
    const feed = parseRss(VALID);
    expect(feed.title).toBe('Feed & pruebas');
    expect(feed.items).toHaveLength(2);
    expect(feed.items[0]).toEqual({
      title: 'Primer elemento',
      link: 'https://example.org/1',
      description: 'Texto <b>uno</b>',
      pubDate: 'Tue, 27 Oct 2026 10:00:00 GMT',
      guid: 'uno',
      category: 'General',
    });
    expect(feed.items[1].pubDate).toBeNull();
  });

  it('rechaza documentos con DOCTYPE o entidades (prevención de XXE)', () => {
    const xxe = `<?xml version="1.0"?>
<!DOCTYPE rss [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<rss version="2.0"><channel><title>&xxe;</title></channel></rss>`;
    expect(() => parseRss(xxe)).toThrow(ConsumerError);
    expect(() => parseRss(xxe)).toThrow(/DOCTYPE/);
  });

  it('rechaza XML que no es RSS', () => {
    expect(() => parseRss('<html><body>hola</body></html>')).toThrow(/rss\/channel/);
  });
});
