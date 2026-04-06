/**
 * Maps API criteria + comparison answers into router state for JobComparisonResults / review flows.
 * Same shape as JobComparisonLanding.handleContinue.
 */
export function mapCriteriaFromApi(rawCriteria) {
  if (!Array.isArray(rawCriteria)) return [];
  return rawCriteria.map((x) => ({
    id: x.id ?? x.Id,
    name: x.name ?? x.Name,
    section: x.section ?? x.Section,
    category: (x.category ?? x.Category ?? "").toUpperCase(),
    description: x.description ?? x.Description,
  }));
}

export function mapAnswersFromComparisonApi(rawAnswers) {
  if (!Array.isArray(rawAnswers)) return {};
  return rawAnswers.reduce((acc, a) => {
    const id = a.criterionId ?? a.CriterionId ?? a.criterion_id;
    if (id == null) return acc;
    const oldNA = !!(a.notApplicable ?? a.NotApplicable ?? a.not_applicable);
    const naA = a.notApplicableA ?? a.NotApplicableA ?? oldNA;
    const naB = a.notApplicableB ?? a.NotApplicableB ?? oldNA;
    acc[id] = {
      weight: a.weight ?? a.Weight ?? 0,
      scoreA: a.scoreA ?? a.ScoreA ?? a.score_a ?? 0,
      scoreB: a.scoreB ?? a.ScoreB ?? a.score_b ?? 0,
      notApplicable: !!(naA && naB),
      notApplicableA: !!naA,
      notApplicableB: !!naB,
    };
    return acc;
  }, {});
}
