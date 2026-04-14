import { XMLParser } from 'fast-xml-parser';

const APPLE_PODCAST_ID = '1567244331';
const APPLE_LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_PODCAST_ID}`;
const APPLE_PODCAST_BASE = `https://podcasts.apple.com/us/podcast/id${APPLE_PODCAST_ID}`;

export interface PodcastEpisode {
  number: string;
  title: string;
  duration?: string;
  pubDate?: string;
  spotifyLink: string;
  applePodcastLink: string;
}

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { '#text': string };
  pubDate?: string;
  'itunes:episode'?: string | number;
  'itunes:duration'?: string;
  enclosure?: { '@_url'?: string };
}

interface RssChannel {
  item?: RssItem | RssItem[];
}

interface RssDocument {
  rss?: { channel?: RssChannel };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

/**
 * Returns the latest N episodes from the Apple Podcasts RSS feed.
 * Returns null if the feed is unreachable or unparseable so the caller
 * can fall back to hardcoded data.
 *
 * Caches Apple lookup for 24h and the RSS itself for 1h.
 */
export async function getLatestEpisodes(limit = 3): Promise<PodcastEpisode[] | null> {
  try {
    const lookupRes = await fetch(APPLE_LOOKUP_URL, {
      next: { revalidate: 86400 },
    });
    if (!lookupRes.ok) throw new Error(`Apple lookup ${lookupRes.status}`);
    const lookup = (await lookupRes.json()) as { results?: Array<{ feedUrl?: string }> };
    const feedUrl = lookup.results?.[0]?.feedUrl;
    if (!feedUrl) throw new Error('No feedUrl in Apple lookup response');

    const rssRes = await fetch(feedUrl, { next: { revalidate: 3600 } });
    if (!rssRes.ok) throw new Error(`RSS ${rssRes.status}`);
    const xml = await rssRes.text();

    const doc = parser.parse(xml) as RssDocument;
    const items = doc.rss?.channel?.item;
    if (!items) return null;

    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray.slice(0, limit).map((item, idx) => {
      const epNum = item['itunes:episode'];
      const number = epNum != null ? String(epNum) : String(itemArray.length - idx);
      const guid = typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] ?? '';
      return {
        number,
        title: cleanText(item.title ?? ''),
        duration: formatDuration(item['itunes:duration']),
        pubDate: item.pubDate,
        spotifyLink: deriveSpotifyEpisodeLink(item.link, guid),
        applePodcastLink: APPLE_PODCAST_BASE,
      };
    });
  } catch (e) {
    console.error('[podcast rss] feed fetch failed:', e);
    return null;
  }
}

function cleanText(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

/** Apple sends durations as "MM:SS", "HH:MM:SS" or seconds. Normalize to "X min" or "X h". */
function formatDuration(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;

  if (/^\d+$/.test(str)) {
    const totalSec = parseInt(str, 10);
    return secondsToHuman(totalSec);
  }
  const parts = str.split(':').map((n) => parseInt(n, 10));
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  let totalSec = 0;
  if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];
  else totalSec = parts[0];
  return secondsToHuman(totalSec);
}

function secondsToHuman(s: number): string {
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.round((s % 3600) / 60);
    return m > 0 ? `${h}h ${m} min` : `${h} h`;
  }
  return `${Math.round(s / 60)} min`;
}

/**
 * Best-effort: if the RSS link points to Spotify, use it. Otherwise fall back
 * to the show URL (user can find the episode there).
 */
function deriveSpotifyEpisodeLink(link?: string, _guid?: string): string {
  if (link && link.includes('spotify.com')) return link;
  return 'https://open.spotify.com/show/6eMZqxyHUtW46yJd0Et4uw';
}
