// Reasoning fields are never selected. Some compatible APIs embed them in text instead.
export function visibleAIContent(content: string): string {
  let depth = 0,
    end = 0,
    output = '';
  const tags = /<\s*(\/?)\s*(think|thinking|analysis|reasoning)\b[^>]*>/gi;
  for (const match of content.matchAll(tags)) {
    if (depth === 0) output += content.slice(end, match.index);
    if (match[1]) depth = Math.max(0, depth - 1);
    else depth++;
    end = match.index! + match[0].length;
  }
  if (depth === 0) output += content.slice(end);
  return output.trim();
}
