/**
 * Season Agent
 *
 * Boosts seasonal ingredients based on current month.
 */

/**
 * Score seasonal relevance for a food
 * @param {Object} food - must include food.season array
 * @param {Object} _context - unused, kept for interface consistency
 * @returns {number} 0..1
 */
export function scoreSeason(food, _context) {
  const currentMonth = new Date().getMonth(); // 0-11
  const season = food.season;

  // No season data = year-round or imported
  if (!season || season.length === 0) return 0.5;

  // In season
  if (season.includes(currentMonth)) return 1.0;

  // Adjacent month
  const prevMonth = (currentMonth + 11) % 12;
  const nextMonth = (currentMonth + 1) % 12;
  if (season.includes(prevMonth) || season.includes(nextMonth)) return 0.7;

  // Out of season
  return 0.2;
}
