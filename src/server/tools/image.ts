export function placeholderSvg(prompt: string): string {
  const safe = prompt.replace(/[<>]/g, "");
  const title = "/image";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576" viewBox="0 0 1024 576">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0f172a" />
      <stop offset="1" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="1024" height="576" fill="url(#g)" />
  <rect x="48" y="48" width="928" height="480" rx="24" fill="#0b1020" opacity="0.85" stroke="#334155" />
  <text x="96" y="140" fill="#e2e8f0" font-family="ui-sans-serif, system-ui, -apple-system" font-size="44" font-weight="700">${title}</text>
  <text x="96" y="210" fill="#94a3b8" font-family="ui-sans-serif, system-ui, -apple-system" font-size="22">Placeholder image generator (open-source stub)</text>
  <text x="96" y="290" fill="#e2e8f0" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="20">prompt:</text>
  <foreignObject x="96" y="310" width="832" height="180">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#e2e8f0;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;font-size:18px;white-space:pre-wrap;line-height:1.35">${safe}</div>
  </foreignObject>
</svg>`;
}
