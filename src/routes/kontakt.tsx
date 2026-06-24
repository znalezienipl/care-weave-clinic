import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone } from "lucide-react";
import { LocationCard } from "@/components/site/LocationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClinicData } from "@/lib/clinic.functions";

const qo = queryOptions({ queryKey: ["clinic"], queryFn: () => getClinicData() });

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Medical Clinic" },
      { name: "description", content: "Skontaktuj się z Medical Clinic. Lokalizacje: Kraków, ul. Retoryka 9/3 oraz Zakopane, ul. Tetmajera 7." },
      { property: "og:title", content: "Kontakt — Medical Clinic" },
      { property: "og:description", content: "Lokalizacje, godziny otwarcia i formularz kontaktowy." },
      { property: "og:url", content: "/kontakt" },
    ],
    links: [{ rel: "canonical", href: "/kontakt" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSuspenseQuery(qo);
  const settings = data.settings;
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Kontakt</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Porozmawiajmy o Twojej wizycie.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Nasza recepcja chętnie odpowie na Twoje pytania, pomoże wybrać właściwą wizytę i lekarza.
          </p>

          <dl className="mt-10 space-y-5 text-sm">
            {settings?.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Email</dt>
                  <dd className="mt-0.5"><a className="font-display text-base font-medium text-foreground hover:underline" href={`mailto:${settings.email}`}>{settings.email}</a></dd>
                </div>
              </div>
            )}
            {settings?.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Telefon</dt>
                  <dd className="mt-0.5"><a className="font-display text-base font-medium text-foreground hover:underline" href={`tel:${settings.phone.replace(/\s/g,"")}`}>{settings.phone}</a></dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Lokalizacje</dt>
                <dd className="mt-0.5 font-display text-base font-medium text-foreground">Kraków · Zakopane</dd>
              </div>
            </div>
          </dl>
        </div>

        <form
          className="rounded-3xl border border-border bg-surface p-8 shadow-soft"
          onSubmit={(e) => { e.preventDefault(); alert("Dziękujemy — skontaktujemy się z Tobą wkrótce."); }}
        >
          <h2 className="font-display text-2xl font-semibold text-foreground">Formularz kontaktowy</h2>
          <p className="mt-2 text-sm text-muted-foreground">Odpowiadamy w ciągu jednego dnia roboczego.</p>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Imię i nazwisko</Label>
              <Input required className="h-12 rounded-2xl border-border bg-surface px-4 text-base" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Email</Label>
              <Input required type="email" className="h-12 rounded-2xl border-border bg-surface px-4 text-base" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Wiadomość</Label>
              <textarea required rows={5} className="rounded-2xl border border-border bg-surface px-4 py-3 text-base focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <Button type="submit" className="mt-2 h-12 rounded-full">Wyślij wiadomość</Button>
          </div>
        </form>
      </div>

      <div className="mt-20 grid gap-6 lg:grid-cols-2">
        {data.locations.map((l) => (
          <LocationCard key={l.id} location={l} />
        ))}
      </div>
    </div>
  );
}
