export function prettyXml(xml: string): string {
  const tokens = xml.replace(/>\s*</g, '><').replace(/></g, '>\n<').split('\n');
  let depth = 0;
  return tokens
    .map((line) => {
      const isClosing = /^<\//.test(line);
      const isSelfContained = /^<[^!?/][^>]*>.*<\/[^>]+>$/.test(line) || /\/>$/.test(line);
      const isOpening = /^<[^!?/]/.test(line) && !isSelfContained;
      if (isClosing) depth = Math.max(depth - 1, 0);
      const out = `${'  '.repeat(depth)}${line}`;
      if (isOpening) depth++;
      return out;
    })
    .join('\n');
}

export function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function prettyRaw(text: string): string {
  return text.trimStart().startsWith('<') ? prettyXml(text) : prettyJson(text);
}

export const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
