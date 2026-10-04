/**
 * Coordonnées PWFINTECH affichées dans l'appli (variables EXPO_PUBLIC_COMPANY_*).
 * Valeur absente → « À compléter » : aucune information n'est inventée.
 */
function v(value: string | undefined) {
  const s = value?.trim();
  return s ? s : null;
}

export const company = {
  email: v(process.env.EXPO_PUBLIC_COMPANY_EMAIL),
  phone: v(process.env.EXPO_PUBLIC_COMPANY_PHONE),
  whatsapp: v(process.env.EXPO_PUBLIC_COMPANY_WHATSAPP),
  legalName: v(process.env.EXPO_PUBLIC_COMPANY_LEGAL_NAME) ?? "Paul World Finances and Technologies",
};

export const PLACEHOLDER = "À compléter";
