import { SectionTitle, ToggleRow } from "@/components/form";
import { Card, Header, Screen } from "@/components/ui";
import { useSession, type NotificationPrefs } from "@/lib/session";

export default function NotificationSettings() {
  const { profile, settings, updateSettings } = useSession();
  const n = settings.notifications;
  const set = (k: keyof NotificationPrefs) => (v: boolean) => updateSettings({ notifications: { ...n, [k]: v } });

  return (
    <Screen>
      <Header title="Notifications" />
      <SectionTitle>Me prévenir pour</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ToggleRow icon="send" label="Statut des transferts" sub="Paiement reçu, versé, livré" value={n.transfers} onChange={set("transfers")} />
        <ToggleRow icon="finance" label="Alertes de taux" sub="Quand le taux devient favorable" value={n.rates} onChange={set("rates")} />
        <ToggleRow icon="ship" label="Shipping" sub="Étapes de vos colis" value={n.shipping} onChange={set("shipping")} />
        <ToggleRow icon="clock" label="Rendez-vous finances" sub="Rappel la veille du rendez-vous" value={n.finance} onChange={set("finance")} />
        <ToggleRow icon="bell" label="Offres et nouveautés" sub="Au plus une fois par mois" value={n.offers} onChange={set("offers")} />
      </Card>
      <SectionTitle>Canaux</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <ToggleRow icon="phone" label="Notifications push" sub="Sur cet appareil" value={n.push} onChange={set("push")} />
        <ToggleRow icon="mail" label="Courriel" sub={profile?.email} value={n.email} onChange={set("email")} />
        <ToggleRow icon="phone" label="SMS" sub={profile?.phone} value={n.sms} onChange={set("sms")} />
      </Card>
    </Screen>
  );
}
