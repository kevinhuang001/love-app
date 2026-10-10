import { describe, expect, it } from 'vitest';
import { aiMention, completeMention } from '../../apps/client/src/lib/chat';

describe('AI mention completion at the caret', () => {
  it('offers only the configured assistant at a complete mention boundary', () => {
    expect(aiMention('@', 1, '松子')).toEqual({ start: 0, end: 1 });
    expect(aiMention('你好 @松', 5, '松子')).toEqual({ start: 3, end: 5 });
    for (const text of ['user@example.com', '@ai', '@松子子', '@松子 ', '你好@松'])
      expect(aiMention(text, text.length, '松子')).toBeNull();
  });
  it('replaces just the incomplete name and preserves text after the caret', () => {
    const text = '请 @松比较两张照片';
    const range = aiMention(text, 4, '松子')!;
    expect(completeMention(text, range, '松子')).toEqual({
      text: '请 @松子 比较两张照片',
      caret: 6,
    });
  });
  it('uses the current name after either partner renames the assistant', () => {
    expect(aiMention('@松', 2, '星星')).toBeNull();
    expect(aiMention('@星', 2, '星星')).not.toBeNull();
  });
});
