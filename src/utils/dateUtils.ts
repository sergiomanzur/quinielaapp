import moment from 'moment-timezone';

/**
 * Date utilities for consistent handling of dates in CST timezone
 */

// CST Timezone offset is UTC-6:00
const CST_TIMEZONE = 'America/Chicago'; // Chicago uses CST

export const toCST = (date: Date | string): string => {
  return moment(date).tz(CST_TIMEZONE).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
};

export const formatDateCST = (date: Date | string): string => {
  return moment(date).tz(CST_TIMEZONE).format('YYYY-MM-DD');
};

export const formatDateTimeCST = (date: Date | string): string => {
  return moment(date).tz(CST_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * Convert a local date to ISO string while preserving the CST timezone intent
 */
export const toISOStringPreservingCST = (date: Date): string => {
  return toCST(date);
};

/**
 * Get current date in CST timezone
 */
export const getCurrentDateCST = (): Date => {
  const now = new Date();
  // Return current date adjusted to CST
  return new Date(toCST(now));
};

/**
 * Check if a date has passed in CST timezone
 */
export const isDatePassedCST = (dateString: string): boolean => {
  const now = getCurrentDateCST();
  const date = new Date(toCST(dateString));
  return date < now;
};

/**
 * Convert a form date string (YYYY-MM-DD) to an ISO date string in CST timezone
 */
export const formDateToISOStringCST = (formDate: string): string => {
  if (!formDate) return '';
  
  try {
    // Add a default time (noon) to ensure consistent behavior
    const dateWithTime = new Date(`${formDate}T12:00:00`);
    return toCST(dateWithTime);
  } catch (error) {
    console.error('Error converting form date to ISO string with CST:', error);
    return '';
  }
};
