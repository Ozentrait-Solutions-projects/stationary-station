import api from '../services/api';

/**
 * Dynamically resolves relative upload paths (/uploads/...) to fully qualified URLs.
 * Compatible with local development, custom API domain, and Vercel production deployment.
 */
export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  // Retrieve base API URL
  let apiBase = api.defaults.baseURL || '';
  
  if (!apiBase && typeof window !== 'undefined') {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    apiBase = isLocalHost ? 'http://localhost:5000/api' : `${window.location.origin}/api`;
  }

  // Strip trailing /api or /api/
  let origin = apiBase.replace(/\/api\/?$/, '');

  // If origin is empty or relative (e.g. '/api' => origin ''), fallback to current origin or localhost
  if (!origin || origin.startsWith('/')) {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      origin = isLocal ? 'http://localhost:5000' : window.location.origin;
    } else {
      origin = 'http://localhost:5000';
    }
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanPath}`;
};

/**
 * Safely parses raw evidence photo fields (PostgreSQL text array '{...}', JSON string, or JS Array)
 * into a clean JavaScript array of URL strings.
 */
export const parseEvidenceUrls = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Handle PostgreSQL array literal format: "{/uploads/a.jpg,/uploads/b.jpg}"
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^"/, '').replace(/"$/, ''))
        .filter(Boolean);
    }

    // Handle JSON array format
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) {}

    return [trimmed];
  }

  return [];
};

/**
 * Formats evidence photo URLs and video URL into a unified array of evidence items.
 * Example return: [{ type: 'image', url: '...' }, { type: 'video', url: '...' }]
 */
export const formatEvidenceItems = (photoUrls, videoUrl) => {
  const items = [];
  const photos = parseEvidenceUrls(photoUrls);

  photos.forEach((url) => {
    if (url) {
      items.push({ type: 'image', url });
    }
  });

  if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim()) {
    items.push({ type: 'video', url: videoUrl.trim() });
  }

  return items;
};
