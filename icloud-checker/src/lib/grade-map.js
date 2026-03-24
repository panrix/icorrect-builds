/**
 * grade-map.js — Monday grade labels → BackMarket API grade codes
 * BM API expects: FAIR, GOOD, VERY_GOOD, EXCELLENT
 * Monday board uses: Grade A, Grade B, Grade C, etc.
 */

const GRADE_MAP = {
  'Grade A': 'VERY_GOOD',
  'Grade B': 'GOOD',
  'Grade C': 'FAIR',
  // Label aliases (Monday pickers may use these)
  'Excellent': 'VERY_GOOD',
  'Very Good': 'VERY_GOOD',
  'Good': 'GOOD',
  'Fair': 'FAIR',
  // Short aliases
  'A': 'VERY_GOOD',
  'B': 'GOOD',
  'C': 'FAIR',
};

/**
 * Map a Monday grade label to a BM API grade code.
 * @param {string} mondayGrade - Grade label from Monday (e.g. "Grade A")
 * @returns {string|null} - BM grade code or null if unmapped
 */
function mapGrade(mondayGrade) {
  if (!mondayGrade) return null;
  return GRADE_MAP[mondayGrade.trim()] || null;
}

module.exports = { GRADE_MAP, mapGrade };
