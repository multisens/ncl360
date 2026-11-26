// Renders the inline Markdown used in src/data/elementos.ts: `code` and
// [text](link). Everything else is escaped.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function escape(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Turns a link written relative to /referencia/elementos/ into an absolute one. */
function href(link: string) {
    if (/^[a-z]+:/.test(link) || link.startsWith('#')) return link;
    const url = new URL(link, 'https://x/referencia/elementos/');
    return `${BASE}${url.pathname}${url.hash}`;
}

export function inline(text: string): string {
    return escape(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, l) => `<a href="${href(l)}">${t}</a>`);
}

export function url(path: string): string {
    return `${BASE}${path}`;
}
