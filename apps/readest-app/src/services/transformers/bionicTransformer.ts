import { TransformContext, Transformer } from './types';

export const bionicTransformer: Transformer = {
  name: 'bionic',
  transform: async (ctx: TransformContext) => {
    const { content, viewSettings } = ctx;

    if (!viewSettings?.bionicReadingEnabled) {
      return content;
    }

    const intensity = viewSettings.bionicReadingIntensity ?? 0.5;

    // Split content by HTML tags to safely transform text nodes only
    const parts = content.split(/(<[^>]+>)/g);

    const transformedParts = parts.map((part) => {
      // If part starts with <, it's a tag, return as is
      if (part.startsWith('<')) return part;

      // Otherwise it's text, apply transformation
      // Skip empty strings or whitespace-only strings if needed,
      // but regex replacement handles them gracefully (no match).

      // Use a regex that matches words.
      // \w includes alphanumeric. We want to be careful with punctuation.
      // \b matches word boundaries.
      return part.replace(/\b([a-zA-Z0-9À-ÿ]+)\b/g, (match) => {
        if (match.length <= 1) return match;

        const boldLength = Math.max(1, Math.floor(match.length * intensity));
        const boldPart = match.slice(0, boldLength);
        const normalPart = match.slice(boldLength);
        return `<b>${boldPart}</b>${normalPart}`;
      });
    });

    return transformedParts.join('');
  },
};
