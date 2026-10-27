export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string | null;
  category: string | null;
}

export interface RssFeed {
  title: string;
  link: string;
  description: string;
  items: RssItem[];
}
