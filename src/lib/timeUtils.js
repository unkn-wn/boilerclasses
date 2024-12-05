
/**
 * Converts military time to formatted 12-hour string (e.g., "2:30 PM")
 */
export const convertNumberToTime = (timeNum) => {
  const hours = Math.floor(timeNum / 100);
  const minutes = timeNum % 100;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Converts 24-hour format string to 12-hour format string (e.g., "14:30" to "2:30 PM")
 */
export const convertTo12HourFormat = (time) => {
  const [hour, minute] = time.split(':');
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
};

/**
 * Calculates end time in military format given start time and duration
 * @param {string} startTime - Start time in "HH:MM" format
 * @param {string} duration - Duration in "PTxHyM" format
 * @returns {number} End time in military format (e.g., 1430 for 2:30 PM)
 */
export const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const durationHours = duration.includes('H') ? parseInt(duration.split('H')[0]) : 0;
  const durationMinutes = duration.includes('M') ?
    parseInt(duration.split('H')[1]?.replace('M', '') || duration.replace('M', '')) : 0;

  let totalMinutes = hours * 60 + minutes + (durationHours * 60) + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;

  return endHours * 100 + endMinutes;
};