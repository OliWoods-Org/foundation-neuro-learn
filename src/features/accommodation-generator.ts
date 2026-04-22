/**
 * Accommodation Generator — Generate IEP/504 accommodation recommendations.
 * @module accommodation-generator
 * @license GPL-3.0
 * @author OliWoods Foundation
 */
import { z } from 'zod';

export const AccommodationSchema = z.object({
  id: z.string(), condition: z.string(), category: z.enum(['testing', 'classroom', 'assignment', 'technology', 'environmental', 'behavioral', 'social']),
  accommodation: z.string(), rationale: z.string(), legalBasis: z.string(), implementationNotes: z.string(),
});

export const AccommodationPlanSchema = z.object({
  studentName: z.string(), conditions: z.array(z.string()), planType: z.enum(['504', 'iep', 'informal']),
  accommodations: z.array(AccommodationSchema), generatedAt: z.string().datetime(),
  reviewDate: z.string(), parentRights: z.array(z.string()),
});

export type Accommodation = z.infer<typeof AccommodationSchema>;
export type AccommodationPlan = z.infer<typeof AccommodationPlanSchema>;

const ACCOMMODATION_DB: Accommodation[] = [
  // Dyslexia
  { id: 'dy1', condition: 'dyslexia', category: 'testing', accommodation: 'Extended time (1.5x-2x) on all timed tests and assignments', rationale: 'Dyslexia affects reading speed, not comprehension. Timed tests measure speed rather than knowledge.', legalBasis: 'Section 504, ADA, IDEA', implementationNotes: 'Apply to all subjects, not just reading/language arts' },
  { id: 'dy2', condition: 'dyslexia', category: 'technology', accommodation: 'Text-to-speech software for all written material', rationale: 'Allows access to grade-level content without reading as a barrier', legalBasis: 'Section 504, IDEA', implementationNotes: 'Ensure software is available on school and personal devices' },
  { id: 'dy3', condition: 'dyslexia', category: 'classroom', accommodation: 'Audio versions of textbooks and written instructions', rationale: 'Multi-modal content delivery supports comprehension', legalBasis: 'Section 504, IDEA', implementationNotes: 'Bookshare.org provides free audiobooks for eligible students' },
  { id: 'dy4', condition: 'dyslexia', category: 'assignment', accommodation: 'Spelling not graded in content-area subjects', rationale: 'Spelling difficulty is a symptom of dyslexia, not lack of effort or content knowledge', legalBasis: 'Section 504', implementationNotes: 'Apply to science, social studies, etc. Spelling may still be addressed in specific spelling instruction' },
  // ADHD
  { id: 'ad1', condition: 'adhd', category: 'environmental', accommodation: 'Preferential seating away from distractions (door, window, high-traffic)', rationale: 'Reduces external stimuli that compete for attention', legalBasis: 'Section 504, IDEA', implementationNotes: 'Near the teacher, not isolated — avoid stigmatizing placement' },
  { id: 'ad2', condition: 'adhd', category: 'testing', accommodation: 'Extended time and separate testing environment', rationale: 'Reduces time pressure that exacerbates attention difficulties', legalBasis: 'Section 504, IDEA', implementationNotes: 'Small group setting with minimal distractions' },
  { id: 'ad3', condition: 'adhd', category: 'behavioral', accommodation: 'Planned movement breaks every 15-20 minutes', rationale: 'Physical movement helps regulate attention and arousal', legalBasis: 'Section 504', implementationNotes: 'Class jobs (distributing papers) serve as functional movement breaks' },
  { id: 'ad4', condition: 'adhd', category: 'assignment', accommodation: 'Break long assignments into smaller chunks with check-ins', rationale: 'Smaller tasks are more manageable and provide dopamine feedback from completion', legalBasis: 'Section 504', implementationNotes: 'Use a checklist format the student can mark off' },
  // Autism
  { id: 'au1', condition: 'autism', category: 'classroom', accommodation: 'Visual schedule and advance notice of transitions/changes', rationale: 'Predictability reduces anxiety and supports executive function', legalBasis: 'IDEA', implementationNotes: 'Post daily schedule visually; give 5-minute warning before transitions' },
  { id: 'au2', condition: 'autism', category: 'environmental', accommodation: 'Access to quiet space for sensory breaks', rationale: 'Sensory overload impairs learning; proactive breaks prevent meltdowns', legalBasis: 'IDEA, Section 504', implementationNotes: 'Define specific location and process — should not be punitive' },
  { id: 'au3', condition: 'autism', category: 'social', accommodation: 'Direct instruction in social expectations before group activities', rationale: 'Social rules that are intuitive for neurotypical students may need explicit teaching', legalBasis: 'IDEA', implementationNotes: 'Use social stories or role-play; assign a supportive peer partner' },
];

export function generateAccommodationPlan(studentName: string, conditions: string[], planType: AccommodationPlan['planType']): AccommodationPlan {
  const matched = ACCOMMODATION_DB.filter(a => conditions.some(c => c.toLowerCase().includes(a.condition)));
  const reviewDate = new Date();
  reviewDate.setFullYear(reviewDate.getFullYear() + 1);
  return AccommodationPlanSchema.parse({
    studentName, conditions, planType, accommodations: matched, generatedAt: new Date().toISOString(),
    reviewDate: reviewDate.toISOString().split('T')[0],
    parentRights: [
      'You have the right to request an evaluation at any time — the school must respond within a reasonable timeframe',
      'You have the right to review all educational records',
      'You have the right to participate in all meetings about your child\'s accommodations',
      'You have the right to disagree with the school\'s decisions and request mediation or due process',
      'The school cannot change or remove accommodations without your consent and a meeting',
      'Evaluations must be provided at no cost to you',
    ],
  });
}

export function findFreeEvaluationResources(state: string): Array<{ name: string; description: string; contact: string }> {
  return [
    { name: 'School District (IDEA)', description: 'Request a free evaluation in writing. The school must evaluate within 60 days.', contact: 'Your child\'s school principal or special education coordinator' },
    { name: 'University Training Clinics', description: 'Psychology doctoral programs often offer reduced-cost evaluations ($200-500 vs $2,000-5,000)', contact: 'Search "[your state] university psychology clinic" ' },
    { name: 'Community Health Centers', description: 'Federally qualified health centers may offer developmental screenings on a sliding scale', contact: 'findahealthcenter.hrsa.gov' },
    { name: 'State Disability Services', description: 'Vocational rehabilitation and disability services may cover evaluation costs for adults', contact: `Search "${state} vocational rehabilitation"` },
  ];
}
