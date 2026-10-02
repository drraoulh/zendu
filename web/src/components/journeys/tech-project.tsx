"use client";

import type { IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { techJourney, wizardMessages } from "@/i18n/journeys";
import { CheckboxCards, RadioCards, TextArea, TextInput } from "./fields";
import { JourneyAside, JourneyShell } from "./shell";
import { EMAIL_RE, PHONE_RE } from "./submit";
import { Wizard, type WizardStep } from "./wizard";

const TYPES = ["website", "mobile_app", "payments_fintech", "digital_transformation", "maintenance", "other"] as const;
const TYPE_ICONS: Record<(typeof TYPES)[number], IconName> = {
  website: "code",
  mobile_app: "phone",
  payments_fintech: "card",
  digital_transformation: "tech",
  maintenance: "shield",
  other: "sparkle",
};
const BUDGETS = ["under_5k", "5k_15k", "15k_50k", "over_50k", "undecided"] as const;
const TIMELINES = ["asap", "1_3_months", "3_6_months", "over_6_months", "flexible"] as const;

type Values = {
  projectTypes: string[];
  otherType: string;
  description: string;
  goals: string;
  website: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  company: string;
};

const INITIAL: Values = {
  projectTypes: [],
  otherType: "",
  description: "",
  goals: "",
  website: "",
  budget: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
  company: "",
};

const URL_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i;

export function TechProjectJourney() {
  const t = useT(techJourney);
  const w = useT(wizardMessages);

  const typeLabel = (v: string) => (TYPES.includes(v as (typeof TYPES)[number]) ? t(`type_${v as (typeof TYPES)[number]}`) : v);
  const budgetLabel = (v: string) =>
    BUDGETS.includes(v as (typeof BUDGETS)[number]) ? t(`budget_${v as (typeof BUDGETS)[number]}`) : v;
  const timelineLabel = (v: string) =>
    TIMELINES.includes(v as (typeof TIMELINES)[number]) ? t(`timeline_${v as (typeof TIMELINES)[number]}`) : v;

  const steps: WizardStep<Values>[] = [
    {
      key: "types",
      label: t("stepTypes"),
      title: t("typesTitle"),
      description: t("typesText"),
      fields: ["projectTypes", "otherType"],
      validate: (v) => ({
        projectTypes: v.projectTypes.length ? undefined : t("errTypes"),
        otherType: v.projectTypes.includes("other") && !v.otherType.trim() ? w("errRequired") : undefined,
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <CheckboxCards
            id={fieldId("projectTypes")}
            label={t("typesLabel")}
            hint={t("typesHint")}
            required
            error={errors.projectTypes}
            value={values.projectTypes}
            onChange={(v) => set("projectTypes", v)}
            options={TYPES.map((k) => ({
              value: k,
              label: t(`type_${k}`),
              description: t(`type_${k}_text`),
              icon: TYPE_ICONS[k],
            }))}
          />
          {values.projectTypes.includes("other") && (
            <TextInput
              id={fieldId("otherType")}
              label={t("otherTypeLabel")}
              required
              maxLength={160}
              error={errors.otherType}
              value={values.otherType}
              onChange={(v) => set("otherType", v)}
            />
          )}
        </>
      ),
    },
    {
      key: "details",
      label: t("stepDetails"),
      title: t("detailsTitle"),
      description: t("detailsText"),
      fields: ["description", "goals", "website"],
      validate: (v) => ({
        description:
          !v.description.trim() ? w("errRequired") : v.description.trim().length < 20 ? t("errDescriptionShort") : undefined,
        website: v.website.trim() && !URL_RE.test(v.website.trim()) ? t("errUrl") : undefined,
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <TextArea
            id={fieldId("description")}
            label={t("descriptionLabel")}
            hint={t("descriptionHint")}
            required
            rows={5}
            maxLength={3000}
            error={errors.description}
            value={values.description}
            onChange={(v) => set("description", v)}
          />
          <TextArea
            id={fieldId("goals")}
            label={t("goalsLabel")}
            hint={t("goalsHint")}
            rows={3}
            maxLength={1500}
            value={values.goals}
            onChange={(v) => set("goals", v)}
          />
          <TextInput
            id={fieldId("website")}
            label={t("websiteLabel")}
            hint={t("websiteHint")}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
            error={errors.website}
            value={values.website}
            onChange={(v) => set("website", v)}
          />
        </>
      ),
    },
    {
      key: "budget",
      label: t("stepBudget"),
      title: t("budgetTitle"),
      description: t("budgetText"),
      fields: ["budget", "timeline"],
      validate: (v) => ({
        budget: v.budget ? undefined : t("errBudget"),
        timeline: v.timeline ? undefined : t("errTimeline"),
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <RadioCards
            id={fieldId("budget")}
            label={t("budgetLabel")}
            hint={t("budgetHint")}
            required
            error={errors.budget}
            value={values.budget}
            onChange={(v) => set("budget", v)}
            options={BUDGETS.map((k) => ({ value: k, label: t(`budget_${k}`) }))}
          />
          <RadioCards
            id={fieldId("timeline")}
            label={t("timelineLabel")}
            required
            error={errors.timeline}
            value={values.timeline}
            onChange={(v) => set("timeline", v)}
            options={TIMELINES.map((k) => ({ value: k, label: t(`timeline_${k}`) }))}
          />
        </>
      ),
    },
    {
      key: "contact",
      label: t("stepContact"),
      title: t("contactTitle"),
      description: t("contactText"),
      fields: ["name", "email", "phone", "company"],
      validate: (v) => ({
        name: v.name.trim().length >= 2 ? undefined : w("errName"),
        email: !v.email.trim() ? w("errRequired") : EMAIL_RE.test(v.email.trim()) ? undefined : w("errEmail"),
        phone: v.phone.trim() && !PHONE_RE.test(v.phone.trim()) ? w("errPhone") : undefined,
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              id={fieldId("name")}
              label={w("fName")}
              required
              autoComplete="name"
              maxLength={120}
              error={errors.name}
              value={values.name}
              onChange={(v) => set("name", v)}
            />
            <TextInput
              id={fieldId("company")}
              label={t("companyLabel")}
              autoComplete="organization"
              maxLength={160}
              value={values.company}
              onChange={(v) => set("company", v)}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              id={fieldId("email")}
              label={w("fEmail")}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              error={errors.email}
              value={values.email}
              onChange={(v) => set("email", v)}
            />
            <TextInput
              id={fieldId("phone")}
              label={w("fPhone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={errors.phone}
              value={values.phone}
              onChange={(v) => set("phone", v)}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <JourneyShell
      back={{ href: "/technologies", label: t("back") }}
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      icon="code"
      aside={<JourneyAside title={t("asideTitle")} points={[t("aside1"), t("aside2"), t("aside3")]} />}
    >
      <Wizard<Values>
        id="tech"
        kind="tech_project"
        initial={INITIAL}
        steps={steps}
        issueField={(path) => {
          const last = path[path.length - 1];
          // payload.website = site existant ; `website` au premier niveau = pot de miel (ignoré).
          if (path[0] === "payload" && last === "website") return "website";
          if (path[0] === "payload" && last === "company") return "company";
          if (path[0] === "payload" && /^\d+$/.test(last)) return "projectTypes";
          return last === "website" ? undefined : last;
        }}
        summary={(v) => [
          {
            title: t("stepTypes"),
            step: 0,
            rows: [
              { label: t("typesLabel"), value: v.projectTypes.map(typeLabel).join(", ") },
              { label: t("otherTypeLabel"), value: v.projectTypes.includes("other") ? v.otherType : "" },
            ],
          },
          {
            title: t("stepDetails"),
            step: 1,
            rows: [
              { label: t("descriptionLabel"), value: v.description },
              { label: t("goalsLabel"), value: v.goals },
              { label: t("websiteLabel"), value: v.website },
            ],
          },
          {
            title: t("stepBudget"),
            step: 2,
            rows: [
              { label: t("budgetLabel"), value: budgetLabel(v.budget) },
              { label: t("timelineLabel"), value: timelineLabel(v.timeline) },
            ],
          },
          {
            title: t("stepContact"),
            step: 3,
            rows: [
              { label: w("fName"), value: v.name },
              { label: t("companyLabel"), value: v.company },
              { label: w("fEmail"), value: v.email },
              { label: w("fPhone"), value: v.phone },
            ],
          },
        ]}
        toRequest={(v) => {
          const description = [
            v.description.trim(),
            v.goals.trim() ? `\n${t("goalsLabel")} :\n${v.goals.trim()}` : "",
            v.projectTypes.includes("other") && v.otherType.trim() ? `\n${t("otherTypeLabel")} : ${v.otherType.trim()}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          return {
            name: v.name,
            email: v.email,
            phone: v.phone,
            payload: {
              projectTypes: v.projectTypes,
              description,
              budget: v.budget,
              timeline: v.timeline,
              company: v.company.trim() || undefined,
              website: v.website.trim() || undefined,
            },
          };
        }}
      />
    </JourneyShell>
  );
}
