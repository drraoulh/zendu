import { z } from "zod";
import { ACTIVE_COUNTRY_CODES } from "@/lib/corridors";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const optional = (max: number) => z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().trim().max(max).optional());

export const addressSchema = z.object({
  line1: text(2, 160),
  line2: optional(80),
  city: text(2, 80),
  region: text(1, 80),
  postalCode: optional(16),
});

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const profileFields = {
  firstName: text(1, 60),
  lastName: text(1, 60),
  phone: text(6, 32),
  country: z.string().refine((c) => (ACTIVE_COUNTRY_CODES as readonly string[]).includes(c), "Pays non desservi"),
  region: optional(80),
  birthDate: z.preprocess((v) => (v === "" ? undefined : v), z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "JJ/MM/AAAA").optional()),
  occupation: optional(60),
  jobTitle: optional(80),
  address: addressSchema.optional(),
  marketing: z.boolean().optional(),
};

export const signupSchema = z.object({
  email: emailSchema,
  // Longueur et complexité vérifiées par passwordProblem() (message lisible).
  password: z.string().max(200),
  device: optional(120),
  ...profileFields,
});

/** Champs modifiables par le client lui-même (nom légal et date de naissance : seulement avant KYC). */
export const profilePatchSchema = z
  .object({
    email: emailSchema.optional(),
    phone: profileFields.phone.optional(),
    region: profileFields.region,
    occupation: profileFields.occupation,
    jobTitle: profileFields.jobTitle,
    address: addressSchema.optional(),
    marketing: z.boolean().optional(),
    firstName: profileFields.firstName.optional(),
    lastName: profileFields.lastName.optional(),
    birthDate: profileFields.birthDate,
  })
  .strict();

const FIELD_LABELS: Record<string, string> = {
  email: "courriel",
  password: "mot de passe",
  firstName: "prénom",
  lastName: "nom",
  phone: "téléphone",
  country: "pays",
  region: "province / région",
  birthDate: "date de naissance (JJ/MM/AAAA)",
  occupation: "occupation",
  jobTitle: "poste",
  address: "adresse",
  marketing: "préférence de communication",
  device: "appareil",
};

/** Message lisible pour une erreur de validation du profil : « Champs invalides ou manquants : prénom, pays. » */
export function profileErrorMessage(error: z.ZodError): string {
  const unknown = error.issues.flatMap((i) => (i.code === "unrecognized_keys" ? i.keys : []));
  if (unknown.length) return `Champ non modifiable : ${unknown.join(", ")}.`;
  const labels = [...new Set(error.issues.map((i) => FIELD_LABELS[String(i.path[0] ?? "")] ?? String(i.path[0] ?? "")).filter(Boolean))];
  if (!labels.length) return "Données invalides";
  const country = error.issues.find((i) => i.path[0] === "country" && i.code === "custom");
  if (country && labels.length === 1) return `${country.message}.`;
  return `Champs invalides ou manquants : ${labels.join(", ")}.`;
}
