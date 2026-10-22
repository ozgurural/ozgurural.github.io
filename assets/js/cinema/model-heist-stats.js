// Teaching model, not the watermark detector from the accompanying paper.
export const BASE_K = 64, MAX_K = 256, EPS = 0.3, THRESHOLD = 2.3, ATTACK_BUDGET = 1.1;

export function normalCDF(x) {
  const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + (x < 0 ? -erf : erf));
}

// The score keeps its original calibration: noise sigma=1 and a unit-norm key.
// Correlated noise is a common Gaussian component aligned with that key.
// Its covariance is I + (sigma^2 - 1) uu^T, not arbitrary correlation.
export function evidenceState(breadth = 0, attack = 0, correlated = 0) {
  const count = Math.round(BASE_K + (MAX_K - BASE_K) * breadth);
  const cleanMean = EPS * Math.sqrt(count);
  const mean = cleanMean - ATTACK_BUDGET * attack;
  const sigma = 1 + correlated;
  return { count, cleanMean, mean, sigma, threshold: THRESHOLD,
    falseAlarm: 1 - normalCDF(THRESHOLD / sigma),
    power: 1 - normalCDF((THRESHOLD - mean) / sigma) };
}

export function gaussianSamples(random, count) {
  return Array.from({ length: count }, () => Math.sqrt(-2 * Math.log(Math.max(1e-9, random()))) * Math.cos(2 * Math.PI * random()));
}

export function simulatedSums(random) {
  const unmarked = [0], marked = [0];
  for (const noise of gaussianSamples(random, BASE_K)) {
    const n = unmarked.length;
    unmarked.push(unmarked[n - 1] + noise);
    marked.push(marked[n - 1] + noise + EPS);
  }
  return { unmarked, marked };
}
