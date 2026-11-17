export const TONES = ['lavender', 'mint', 'coral', 'peach', 'butter', 'sky', 'pink'] as const;
export type Tone = (typeof TONES)[number] | 'neutral';
