/**
 * Formats a date string to a readable time format
 * @param dateString ISO date string
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * Calculates volume of a package in cubic centimeters
 * @param width Width in cm
 * @param height Height in cm
 * @param depth Depth in cm
 * @returns Volume in cubic centimeters
 */
export const calculateVolume = (
  width: number,
  height: number,
  depth: number
): number => {
  return width * height * depth;
};

/**
 * Converts volume from cubic centimeters to liters
 * @param volumeCm3 Volume in cubic centimeters
 * @returns Volume in liters
 */
export const cmToLiters = (volumeCm3: number): number => {
  return volumeCm3 / 1000;
};

/**
 * Calculates how full a van is
 * @param usedVolume Volume used (in liters)
 * @param totalVolume Van capacity (in liters)
 * @returns Fill percentage (0 to 100)
 */
export const calculateFillPercentage = (
  usedVolume: number,
  totalVolume: number
): number => {
  if (totalVolume === 0) return 0;
  return Math.min(100, (usedVolume / totalVolume) * 100);
};

/**
 * Calculates estimated time of arrival (ETA) in minutes between two dates
 * @param currentTime Current time (Date or ISO string)
 * @param deadline Delivery deadline (Date or ISO string)
 * @returns ETA in minutes
 */
export const calculateETA = (
  currentTime: Date | string,
  deadline: Date | string
): number => {
  const now = new Date(currentTime).getTime();
  const end = new Date(deadline).getTime();
  const diffMs = end - now;
  return Math.floor(diffMs / 60000); // Convert ms to minutes
};

/**
 * Formats a number to 1 decimal place and adds a % symbol
 * @param value Numeric value
 * @returns Formatted string with percent
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Shuffles an array randomly (useful for mock simulations)
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
