/** Returns base email without suffix: firstname.lastname@domain */
export function generateBaseEmail(firstName: string, lastName: string, domain = 'terralogic.com'): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}
