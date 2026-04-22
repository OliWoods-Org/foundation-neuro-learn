/**
 * Screening Tools — Pre-screening for learning differences (not diagnosis).
 * @module screening-tools
 * @license GPL-3.0
 * @author OliWoods Foundation
 */
import { z } from 'zod';

export const ScreeningResponseSchema = z.object({
  questionId: z.string(), answer: z.enum(['never', 'rarely', 'sometimes', 'often', 'always']),
});

export const ScreeningResultSchema = z.object({
  id: z.string().uuid(), userId: z.string(), screeningType: z.enum(['dyslexia', 'adhd', 'autism', 'dyscalculia', 'general']),
  completedAt: z.string().datetime(),
  riskLevel: z.enum(['low', 'moderate', 'elevated', 'high']),
  score: z.number().min(0).max(100), domains: z.array(z.object({ name: z.string(), score: z.number(), concern: z.boolean() })),
  recommendation: z.string(),
  disclaimer: z.string(),
  nextSteps: z.array(z.string()),
});

export type ScreeningResponse = z.infer<typeof ScreeningResponseSchema>;
export type ScreeningResult = z.infer<typeof ScreeningResultSchema>;

const DYSLEXIA_QUESTIONS = [
  { id: 'd1', text: 'Do you find it difficult to read aloud?', domain: 'reading-fluency' },
  { id: 'd2', text: 'Do you often lose your place when reading?', domain: 'tracking' },
  { id: 'd3', text: 'Do you mix up similar-looking letters (b/d, p/q)?', domain: 'visual-processing' },
  { id: 'd4', text: 'Is spelling significantly harder than other skills?', domain: 'spelling' },
  { id: 'd5', text: 'Do you have difficulty sounding out unfamiliar words?', domain: 'phonological-awareness' },
  { id: 'd6', text: 'Do you read much slower than your peers?', domain: 'reading-fluency' },
  { id: 'd7', text: 'Do you understand spoken explanations better than written ones?', domain: 'comprehension-gap' },
  { id: 'd8', text: 'Did you have difficulty learning to read as a child?', domain: 'history' },
];

const ADHD_QUESTIONS = [
  { id: 'a1', text: 'Do you have difficulty sustaining attention during tasks?', domain: 'inattention' },
  { id: 'a2', text: 'Do you often lose things needed for tasks?', domain: 'organization' },
  { id: 'a3', text: 'Do you find it hard to wait your turn?', domain: 'impulsivity' },
  { id: 'a4', text: 'Do you fidget or feel restless when sitting?', domain: 'hyperactivity' },
  { id: 'a5', text: 'Do you have difficulty organizing tasks and managing time?', domain: 'executive-function' },
  { id: 'a6', text: 'Do you start tasks but have trouble finishing them?', domain: 'task-completion' },
  { id: 'a7', text: 'Are you easily distracted by unrelated thoughts or stimuli?', domain: 'inattention' },
  { id: 'a8', text: 'Do you procrastinate on tasks that require sustained mental effort?', domain: 'avoidance' },
];

export function getScreeningQuestions(type: 'dyslexia' | 'adhd'): Array<{ id: string; text: string; domain: string }> {
  return type === 'dyslexia' ? DYSLEXIA_QUESTIONS : ADHD_QUESTIONS;
}

export function scoreScreening(
  type: ScreeningResult['screeningType'], userId: string, responses: ScreeningResponse[],
): ScreeningResult {
  const scoreMap = { never: 0, rarely: 1, sometimes: 2, often: 3, always: 4 };
  const questions = type === 'dyslexia' ? DYSLEXIA_QUESTIONS : ADHD_QUESTIONS;
  const domainScores = new Map<string, number[]>();
  for (const q of questions) {
    if (!domainScores.has(q.domain)) domainScores.set(q.domain, []);
    const response = responses.find(r => r.questionId === q.id);
    if (response) domainScores.get(q.domain)!.push(scoreMap[response.answer]);
  }
  const domains = Array.from(domainScores.entries()).map(([name, scores]) => {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    const normalized = (avg / 4) * 100;
    return { name, score: Math.round(normalized), concern: normalized >= 60 };
  });
  const overallScore = Math.round(domains.reduce((s, d) => s + d.score, 0) / domains.length);
  const riskLevel: ScreeningResult['riskLevel'] = overallScore >= 75 ? 'high' : overallScore >= 55 ? 'elevated' : overallScore >= 35 ? 'moderate' : 'low';
  return ScreeningResultSchema.parse({
    id: crypto.randomUUID(), userId, screeningType: type, completedAt: new Date().toISOString(),
    riskLevel, score: overallScore, domains,
    recommendation: riskLevel === 'high' || riskLevel === 'elevated'
      ? `Your responses suggest you may benefit from a formal ${type} evaluation by a qualified professional.`
      : `Your responses do not suggest strong indicators, but if you have concerns, a professional evaluation is always worthwhile.`,
    disclaimer: 'THIS IS NOT A DIAGNOSIS. This screening is for informational purposes only. Only a qualified professional (psychologist, neuropsychologist, or educational specialist) can diagnose learning differences. A formal evaluation typically costs $2,000-$5,000 but may be available free through schools (for students) or community health centers.',
    nextSteps: [
      'Request a formal evaluation from a psychologist or neuropsychologist',
      'Students: Request a free evaluation through your school under IDEA',
      'Adults: Check if your insurance covers neuropsychological testing',
      'Low-cost options: university training clinics, community health centers',
      'While awaiting evaluation, try the learning adaptations in this tool',
    ],
  });
}
