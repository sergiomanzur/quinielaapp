import { Match, Participant, Prediction, User } from '../types';

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Check if a user is a participant in a quiniela
 */
export const isUserParticipant = (participants: Participant[], userId: string): boolean => {
  return participants.some(p => p.userId === userId);
};

/**
 * Calculate points for a single prediction
 * 
 * Points system:
 * 0 points - Incorrect prediction (wrong winner/draw)
 * 1 point - Correct home win prediction, but wrong score
 * 2 points - Correct draw prediction, but wrong score
 * 3 points - Correct away win prediction, but wrong score
 * 4 points - Exact score prediction
 */
export const calculatePredictionPoints = (prediction: Prediction, match: Match): number => {
  // If match doesn't have results yet, no points
  if (match.homeScore === undefined || match.awayScore === undefined) {
    return 0;
  }

  // Exact score: 4 points
  if (prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore) {
    return 4;
  }

  // Get result types
  const predictionResult = getPredictionResult(prediction);
  const matchResult = getMatchResult(match);

  if (predictionResult === matchResult) {
    // Correct draw: 2 points
    if (matchResult === 'D') {
      return 2;
    }
    // Correct home win: 1 point
    else if (matchResult === 'H') {
      return 1;
    }
    // Correct away win: 3 points
    else if (matchResult === 'A') {
      return 3;
    }
  }

  // Incorrect prediction
  return 0;
};

/**
 * Get the result type of a prediction (home win, away win, draw)
 */
export const getPredictionResult = (prediction: Prediction): 'H' | 'A' | 'D' => {
  if (prediction.homeScore > prediction.awayScore) return 'H'; // Home win
  if (prediction.homeScore < prediction.awayScore) return 'A'; // Away win
  return 'D'; // Draw
};

/**
 * Get the result type of a match (home win, away win, draw)
 */
export const getMatchResult = (match: Match): 'H' | 'A' | 'D' | null => {
  if (match.homeScore === undefined || match.awayScore === undefined) return null;
  
  if (match.homeScore > match.awayScore) return 'H'; // Home win
  if (match.homeScore < match.awayScore) return 'A'; // Away win
  return 'D'; // Draw
};

/**
 * Calculate total points for all participants
 */
export const updateParticipantPoints = (
  participants: Participant[],
  matches: Match[]
): Participant[] => {
  return participants.map(participant => {
    let totalPoints = 0;
    
    // Calculate points for each prediction made by this participant
    participant.predictions.forEach(prediction => {
      const match = matches.find(m => m.id === prediction.matchId);
      if (match && match.homeScore !== undefined && match.awayScore !== undefined) {
        totalPoints += calculatePredictionPoints(prediction, match);
      }
    });
    
    return {
      ...participant,
      points: totalPoints
    };
  });
};

/**
 * Get the winner(s) of a quiniela (may be multiple in case of a tie)
 */
export const getWinners = (participants: Participant[]): Participant[] => {
  if (participants.length === 0) return [];
  
  // Find the highest score
  const highestPoints = Math.max(...participants.map(p => p.points));
  
  // Return all participants with the highest score
  return participants.filter(p => p.points === highestPoints);
};

/**
 * Check if predictions are still allowed (before the first match starts)
 */
export const arePredictionsAllowed = (matches: Match[]): boolean => {
  if (matches.length === 0) return true;
  
  // Find the earliest match date
  const firstMatchDate = new Date(
    matches.reduce((earliest, match) => {
      const matchDate = new Date(match.date);
      return matchDate < earliest ? matchDate : earliest;
    }, new Date(matches[0].date))
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  firstMatchDate.setHours(0, 0, 0, 0);
  
  return today < firstMatchDate;
};

/**
 * Sort participants by points in descending order
 */
export const sortParticipantsByPoints = (participants: Participant[]): Participant[] => {
  return [...participants].sort((a, b) => b.points - a.points);
};

/**
 * Get user information for a participant
 */
export const getUserForParticipant = (
  users: User[],
  participant: Participant
): User | undefined => {
  return users.find(user => user.id === participant.userId);
};
