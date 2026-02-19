/**
 * Sanitizes a string for use in a regular expression.
 * Prevents regex injection by escaping special regex characters.
 */
export const sanitizeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
