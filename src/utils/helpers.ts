/**
 * Generates a company email address from a full name.
 *
 * Examples:
 *   "John Smith"  → "john.smith@terralogic.com"
 *   "Alice"       → "alice@terralogic.com"
 *
 * @param name        Full name of the employee
 * @param domain      Company email domain (defaults to terralogic.com)
 */
export function generateCompanyEmail(
  name: string,
  domain = 'terralogic.com',
): string {
  const parts = name.trim().toLowerCase().split(/\s+/);
  const localPart = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0];
  return `${localPart}@${domain}`;
}
