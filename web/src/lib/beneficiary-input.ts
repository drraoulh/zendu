import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCountry, normalizePhone, validatePhone } from "@/lib/corridors";
import {
  ACCOUNT_NUMBER_REGEX,
  BANK_CODE_REGEX,
  isBankNetwork,
  normalizeAccountNumber,
  normalizeBankCode,
} from "@/lib/bank";

/**
 * Coordonnées du bénéficiaire acceptées par POST /api/transfers et POST /api/beneficiaries.
 * - mobile money / retrait : `phone` obligatoire (validé selon le pays) ;
 * - virement bancaire : `bankName` + `accountNumber` obligatoires, `bankCode` et `phone` facultatifs.
 *   `savedId` permet de réutiliser le compte d'un bénéficiaire enregistré sans renvoyer
 *   le numéro complet (les API publiques ne l'exposent que masqué).
 */
export const beneficiaryInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(32).optional().default(""),
  network: z.string().min(2).max(32),
  bankName: z.string().trim().max(80).optional(),
  accountNumber: z.string().max(64).optional(),
  bankCode: z.string().max(32).optional(),
  savedId: z.string().max(64).optional(),
});

export type BeneficiaryInput = z.infer<typeof beneficiaryInputSchema>;

export type NormalizedBeneficiary = {
  fullName: string;
  phone: string;
  network: string;
  country: string;
  bankName: string | null;
  accountNumber: string | null;
  bankCode: string | null;
};

const bankFieldsSchema = z.object({
  bankName: z
    .string({ error: "Nom de la banque requis" })
    .trim()
    .min(2, "Nom de la banque requis")
    .max(80),
  accountNumber: z
    .string({ error: "Numéro de compte requis" })
    .transform(normalizeAccountNumber)
    .pipe(
      z
        .string()
        .regex(
          ACCOUNT_NUMBER_REGEX,
          "Numéro de compte invalide (6 à 34 lettres ou chiffres : IBAN, RIB ou numéro de compte)",
        ),
    ),
  bankCode: z
    .string()
    .optional()
    .transform((v) => (v ? normalizeBankCode(v) : ""))
    .pipe(
      z.union([
        z.literal(""),
        z.string().regex(BANK_CODE_REGEX, "Code SWIFT/BIC ou code banque invalide (3 à 11 caractères)"),
      ]),
    ),
});

/**
 * Valide les coordonnées selon le type du réseau choisi et renvoie les données à enregistrer,
 * ou un message d'erreur lisible.
 */
export async function normalizeBeneficiary(
  input: BeneficiaryInput,
  countryCode: string,
): Promise<{ ok: true; data: NormalizedBeneficiary } | { ok: false; error: string }> {
  const country = getCountry(countryCode);
  if (!country.networks.some((n) => n.id === input.network)) {
    return { ok: false, error: "Réseau de réception invalide pour ce pays" };
  }

  if (!isBankNetwork(input.network, countryCode)) {
    const phoneError = validatePhone(input.phone, countryCode);
    if (!input.phone || phoneError) {
      return { ok: false, error: phoneError ?? `Numéro requis pour ${country.name}` };
    }
    return {
      ok: true,
      data: {
        fullName: input.fullName,
        phone: normalizePhone(input.phone, countryCode),
        network: input.network,
        country: countryCode,
        bankName: null,
        accountNumber: null,
        bankCode: null,
      },
    };
  }

  // Virement bancaire : téléphone facultatif (utile pour prévenir le bénéficiaire).
  let phone = "";
  if (input.phone) {
    const phoneError = validatePhone(input.phone, countryCode);
    if (phoneError) return { ok: false, error: phoneError };
    phone = normalizePhone(input.phone, countryCode);
  }

  let bank = {
    bankName: input.bankName,
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
  };

  // Réutilisation d'un compte enregistré (numéro jamais renvoyé au navigateur).
  if (input.savedId && !input.accountNumber?.trim()) {
    const saved = await prisma.beneficiary.findUnique({ where: { id: input.savedId } });
    if (!saved || saved.country !== countryCode || !saved.accountNumber) {
      return { ok: false, error: "Bénéficiaire enregistré introuvable pour ce pays" };
    }
    bank = {
      bankName: input.bankName?.trim() || saved.bankName || undefined,
      accountNumber: saved.accountNumber,
      bankCode: input.bankCode ?? saved.bankCode ?? undefined,
    };
  }

  const parsed = bankFieldsSchema.safeParse(bank);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Coordonnées bancaires invalides" };
  }

  return {
    ok: true,
    data: {
      fullName: input.fullName,
      phone,
      network: input.network,
      country: countryCode,
      bankName: parsed.data.bankName,
      accountNumber: parsed.data.accountNumber,
      bankCode: parsed.data.bankCode || null,
    },
  };
}
