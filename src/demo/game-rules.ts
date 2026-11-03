export type RuleMode = 'classic' | 'alcohol-free';
export interface CardRule { title: string; description: string; }

export const CLASSIC_RULES: readonly CardRule[] = [
  { title: 'Waterfall', description: 'Everyone starts drinking together. The player who drew the card stops first; the next player may stop after them, and so on around the table.' },
  { title: 'You', description: 'Choose another player to take a sip.' },
  { title: 'Me', description: 'The player who drew this card takes a sip.' },
  { title: 'Category', description: 'Choose a category, such as colours. Go around the table naming an item without repeating one.' },
  { title: 'Bust a jive', description: 'Make a dance move. The next player repeats it and adds another. Keep the sequence going.' },
  { title: 'Chicks', description: 'The women at the table take a sip.' },
  { title: 'Heaven', description: 'Raise your hands. The last player to notice takes a sip.' },
  { title: 'Mate', description: 'Choose a mate. Until the round ends, whenever either of you drinks, the other joins in.' },
  { title: 'Thumbmaster', description: 'You may put your thumb on the table at any time until another nine is drawn. The last player to copy you takes a sip.' },
  { title: 'Men', description: 'The men at the table take a sip.' },
  { title: 'Quizmaster', description: 'Become the question master until another jack is drawn. Anyone answering one of your questions takes a sip.' },
  { title: 'Never have I ever', description: 'Name something you have never done. Players who have done it take a sip.' },
  { title: 'Rule', description: 'Create a rule for the rest of the round. Anyone breaking it takes a sip.' },
];
export const ALCOHOL_FREE_RULES: readonly CardRule[] = [
  { title: 'Waterfall', description: 'In turn, name something that flows. Keep the chain going.' },
  { title: 'You', description: 'Choose another player to answer a question.' },
  { title: 'Me', description: 'Tell the group one surprising fact about yourself.' },
  CLASSIC_RULES[3], CLASSIC_RULES[4],
  { title: 'Story circle', description: 'Start a story. Each player adds one sentence.' },
  { title: 'Heaven', description: 'Raise your hands. The last player leads the next challenge.' },
  { title: 'Mate', description: 'Choose a teammate for the next challenge.' },
  { title: 'Thumbmaster', description: 'Put your thumb on the table at a chosen moment. Everyone follows; the last player names the next category.' },
  { title: 'Word chain', description: 'Say a word. The next word starts with its final letter.' },
  { title: 'Quizmaster', description: 'Ask the group a trivia question.' },
  { title: 'Never have I ever', description: 'Share something you have never tried.' },
  { title: 'Rule', description: 'Create a playful rule for the rest of the round.' },
];
export function rulesFor(mode: RuleMode): readonly CardRule[] { return mode === 'classic' ? CLASSIC_RULES : ALCOHOL_FREE_RULES; }
