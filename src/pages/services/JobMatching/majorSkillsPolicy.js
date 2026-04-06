/**
 * Technical + soft skill checklists are only interactive for engineering/CS majors.
 * Other majors match on job titles (roles) only.
 */
const SKILLS_SELECTABLE_MAJOR_NAMES = [
  'computer science',
  'computer and communications engineering',
];

export function isMajorSkillsSelectable(majorName) {
  if (majorName == null || typeof majorName !== 'string') return false;
  const n = majorName.trim().toLowerCase();
  return SKILLS_SELECTABLE_MAJOR_NAMES.includes(n);
}
