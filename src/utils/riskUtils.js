/**
 * Utility functions for risk assessment
 */

/**
 * Convert risk score to descriptive text label
 * @param {number} score - The risk score
 * @returns {string} - Descriptive risk level text
 */
export const getRiskScoreLabel = (score) => {
  if (!score || score === 0) return 'Not Assessed';
  
  if (score <= 2) return 'Low Risk';
  if (score <= 9) return 'Medium Risk';
  if (score <= 15) return 'High Risk';
  return 'Critical Risk';
};

/**
 * Get risk color based on score
 * @param {number} score - The risk score
 * @returns {string} - Color hex code
 */
export const getRiskColor = (score) => {
  if (!score || score === 0) return '#9ca3af';
  
  if (score <= 2) return '#8DC63F'; // Low Risk - Green
  if (score <= 9) return '#FFFF00'; // Medium Risk - Yellow
  if (score <= 15) return '#F7941D'; // High Risk - Orange
  return '#ED1C24'; // Critical Risk - Red
};

/**
 * Get risk color category with score range
 * @param {number} score - The risk score
 * @returns {string} - Risk category with score range
 */
export const getRiskColorCategory = (score) => {
  if (!score || score === 0) return 'Not Assessed';
  
  if (score <= 2) return 'Low Risk (1-2)';
  if (score <= 9) return 'Medium Risk (3-9)';
  if (score <= 15) return 'High Risk (10-15)';
  return 'Critical Risk (16-25)';
};
