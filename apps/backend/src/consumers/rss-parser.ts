import type { RssFeed, RssItem } from '@wslab/shared';
import { XMLParser } from 'fast-xml-parser';
import { ConsumerError } from './consumer-error.js';

export const MAX_RSS_ITEMS = 20;
const MAX_TEXT_LENGTH = 500;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  htmlEntities: false,
  isArray: (name) => name === 'item' || name === 'category',
});

function text(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === 'object' && '#text' in node) return text((node as Record<string, unknown>)['#text']);
  return '';
}

function clip(value: string): string {
  return value.length > MAX_TEXT_LENGTH ? `${value.slice(0, MAX_TEXT_LENGTH)}...` : value;
}

export function parseRss(xml: string): RssFeed {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new ConsumerError('INVALID_RESPONSE', 'El XML contiene DOCTYPE o entidades, no se procesa por seguridad');
  }

  let doc: Record<string, any>;
  try {
    doc = parser.parse(xml);
  } catch (err) {
    throw new ConsumerError('INVALID_RESPONSE', `XML mal formado: ${(err as Error).message}`);
  }

  const channel = doc?.rss?.channel;
  if (!channel || typeof channel !== 'object' || !text(channel.title)) {
    throw new ConsumerError('INVALID_RESPONSE', 'El documento no tiene la estructura rss/channel esperada');
  }

  const rawItems: unknown[] = Array.isArray(channel.item) ? channel.item : [];
  const items: RssItem[] = rawItems.slice(0, MAX_RSS_ITEMS).map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      title: clip(text(item.title)),
      link: text(item.link),
      description: clip(text(item.description)),
      pubDate: text(item.pubDate) || null,
      guid: text(item.guid) || null,
      category: text(item.category) || null,
    };
  });

  return {
    title: text(channel.title),
    link: text(channel.link),
    description: clip(text(channel.description)),
    items,
  };
}
