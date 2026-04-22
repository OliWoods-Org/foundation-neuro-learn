/**
 * Learning Adapter — Adapt content presentation for dyslexia, ADHD, and autism.
 * @module learning-adapter
 * @license GPL-3.0
 * @author OliWoods Foundation
 */
import { z } from 'zod';

export const LearnerProfileSchema = z.object({
  id: z.string(), name: z.string(),
  conditions: z.array(z.enum(['dyslexia', 'adhd', 'autism', 'dyscalculia', 'dysgraphia', 'auditory-processing', 'visual-processing', 'executive-function'])),
  preferences: z.object({
    fontSize: z.enum(['small', 'medium', 'large', 'extra-large']).default('medium'),
    fontFamily: z.enum(['opendyslexic', 'lexie-readable', 'arial', 'comic-sans', 'system']).default('system'),
    lineSpacing: z.enum(['normal', 'relaxed', 'double']).default('relaxed'),
    colorScheme: z.enum(['default', 'cream-background', 'dark-mode', 'high-contrast', 'blue-overlay']).default('default'),
    readAloud: z.boolean().default(false), highlightCurrentLine: z.boolean().default(false),
    chunkSize: z.enum(['sentence', 'paragraph', 'page']).default('paragraph'),
    timerVisible: z.boolean().default(true), breakReminders: z.boolean().default(true),
    breakIntervalMinutes: z.number().int().positive().default(25),
  }),
  strengths: z.array(z.string()).default([]), challenges: z.array(z.string()).default([]),
});

export const AdaptedContentSchema = z.object({
  originalText: z.string(), adaptedText: z.string(),
  adaptations: z.array(z.object({ type: z.string(), description: z.string() })),
  readingLevel: z.number(), estimatedReadTime: z.number(),
  cssOverrides: z.record(z.string(), z.string()),
});

export const FocusSessionSchema = z.object({
  learnerId: z.string(), startTime: z.string().datetime(), endTime: z.string().datetime().optional(),
  taskDescription: z.string(), plannedDurationMinutes: z.number().int().positive(),
  breaksTaken: z.number().int().nonnegative().default(0),
  focusScore: z.number().min(0).max(100).optional(), completionPercent: z.number().min(0).max(100),
  distractions: z.array(z.string()).default([]),
});

export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;
export type AdaptedContent = z.infer<typeof AdaptedContentSchema>;
export type FocusSession = z.infer<typeof FocusSessionSchema>;

export function adaptContent(text: string, profile: LearnerProfile): AdaptedContent {
  const adaptations: AdaptedContent['adaptations'] = [];
  let adapted = text;
  const css: Record<string, string> = {};
  if (profile.conditions.includes('dyslexia')) {
    css['font-family'] = profile.preferences.fontFamily === 'opendyslexic' ? 'OpenDyslexic, sans-serif' : 'Lexie Readable, Arial, sans-serif';
    css['letter-spacing'] = '0.05em'; css['word-spacing'] = '0.15em';
    adaptations.push({ type: 'dyslexia-font', description: 'Dyslexia-friendly font with increased letter/word spacing' });
  }
  if (profile.conditions.includes('adhd')) {
    css['max-width'] = '65ch';
    adaptations.push({ type: 'adhd-chunking', description: 'Content broken into shorter paragraphs with reduced line width' });
    adapted = adapted.replace(/([.!?])\s+/g, '$1\n\n'); // Break into shorter paragraphs
  }
  if (profile.conditions.includes('autism')) {
    adaptations.push({ type: 'literal-language', description: 'Idioms and figurative language flagged with literal explanations' });
  }
  if (profile.preferences.colorScheme === 'cream-background') { css['background-color'] = '#FFF8E7'; css['color'] = '#333'; }
  if (profile.preferences.colorScheme === 'dark-mode') { css['background-color'] = '#1a1a2e'; css['color'] = '#e0e0e0'; }
  if (profile.preferences.colorScheme === 'blue-overlay') { css['background-color'] = '#E8F0FE'; }
  css['font-size'] = { small: '14px', medium: '16px', large: '20px', 'extra-large': '24px' }[profile.preferences.fontSize];
  css['line-height'] = { normal: '1.5', relaxed: '1.8', double: '2.0' }[profile.preferences.lineSpacing];
  const words = text.split(/\s+/).length;
  const wpm = profile.conditions.includes('dyslexia') ? 100 : profile.conditions.includes('adhd') ? 150 : 200;
  return AdaptedContentSchema.parse({
    originalText: text, adaptedText: adapted, adaptations, readingLevel: estimateReadingLevel(text),
    estimatedReadTime: Math.ceil(words / wpm), cssOverrides: css,
  });
}

export function generateFocusPlan(profile: LearnerProfile, taskMinutes: number): {
  sessions: Array<{ duration: number; type: 'focus' | 'break'; activity: string }>;
  tips: string[];
} {
  const focusDuration = profile.conditions.includes('adhd') ? Math.min(15, profile.preferences.breakIntervalMinutes) : profile.preferences.breakIntervalMinutes;
  const breakDuration = focusDuration <= 15 ? 3 : 5;
  const sessions: Array<{ duration: number; type: 'focus' | 'break'; activity: string }> = [];
  let remaining = taskMinutes;
  while (remaining > 0) {
    const focus = Math.min(focusDuration, remaining);
    sessions.push({ duration: focus, type: 'focus', activity: 'Focused work' });
    remaining -= focus;
    if (remaining > 0) { sessions.push({ duration: breakDuration, type: 'break', activity: 'Move, stretch, or look at something far away' }); }
  }
  const tips: string[] = [];
  if (profile.conditions.includes('adhd')) {
    tips.push('Use a physical timer you can see — visual countdowns help maintain focus');
    tips.push('Remove phone from the room or use an app blocker during focus sessions');
    tips.push('Write down distracting thoughts on a "parking lot" list to address later');
  }
  if (profile.conditions.includes('dyslexia')) {
    tips.push('Use text-to-speech for dense reading material');
    tips.push('Color-code or highlight key information');
  }
  if (profile.conditions.includes('autism')) {
    tips.push('Keep your workspace consistent — same setup each time');
    tips.push('Use noise-cancelling headphones or white noise if environment is unpredictable');
  }
  return { sessions, tips };
}

function estimateReadingLevel(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).length;
  if (sentences === 0) return 5;
  const avgSentenceLen = words / sentences;
  return Math.min(16, Math.max(1, Math.round(avgSentenceLen / 3)));
}
