export const generateCompanyEmail = (name: string) => {
  const companyDomain = "terralogic.com";

  const parts = name.toLowerCase().split(" ");

  let email = "";

  if (parts.length >= 2) {
    email = `${parts[0]}.${parts[1]}`;
  } else {
    email = parts[0];
  }

  return `${email}@${companyDomain}`;
};