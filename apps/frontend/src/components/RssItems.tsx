import type { RssFeed } from '@wslab/shared';

export function RssItems({ feed }: { feed: RssFeed }) {
  return (
    <div>
      <span className="overline">Canal</span>
      <h3 className="subhead">{feed.title}</h3>
      {feed.description && <p className="small muted">{feed.description}</p>}
      <ul className="feed">
        {feed.items.map((item, i) => (
          <li key={item.guid ?? `${item.link}-${i}`}>
            {/^https?:\/\//.test(item.link) ? (
              <a className="feed-title" href={item.link} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            ) : (
              <span className="feed-title">{item.title}</span>
            )}
            <div className="caption">
              {item.pubDate}
              {item.category ? ` | ${item.category}` : ''}
            </div>
            {item.description && <p>{item.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
