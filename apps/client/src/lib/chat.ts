export function aiMention(text: string, caret: number, name: string) {
  const match = text.slice(0, caret).match(/(?:^|\s)@([^\s@，。！？、,:;!?.]*)$/u);
  if (!match || !name.startsWith(match[1])) return null;
  return { start: caret - match[1].length - 1, end: caret };
}

export function completeMention(text: string, range: { start: number; end: number }, name: string) {
  const prefix = text.slice(0, range.start) + `@${name} `;
  return { text: prefix + text.slice(range.end), caret: prefix.length };
}
