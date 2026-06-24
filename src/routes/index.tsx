import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarCheck, Clock, HeartHandshake, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DoctorCard } from "@/components/site/DoctorCard";
import { ServiceCard } from "@/components/site/ServiceCard";
import { LocationCard } from "@/components/site/LocationCard";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { FAQSection } from "@/components/site/FAQSection";
import { QuickBookingWidget } from "@/components/site/QuickBookingWidget";
import { HeroIllustration } from "@/components/site/HeroIllustration";
import { getClinicData, getNextAvailable } from "@/lib/clinic.functions";
import { formatDateTimePL } from "@/lib/format";

const clinicQO = queryOptions({
  queryKey: ["clinic"],
  queryFn: () => getClinicData(),
});

const nextQO = queryOptions({
  queryKey: ["next-available", "any"],
  queryFn: () => getNextAvailable({ data: { durationMin: 30, daysAhead: 21 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medical Clinic — Prywatna ginekologia w Krakowie i Zakopanem" },
      { name: "description", content: "Prywatna opieka ginekologiczna w Krakowie i Zakopanem. Konsultacje, USG, profilaktyka, ginekologia onkologiczna. Umów wizytę online." },
      { property: "og:title", content: "Medical Clinic — Prywatna opieka ginekologiczna" },
      { property: "og:description", content: "Konsultacje, USG, profilaktyka i ginekologia onkologiczna." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(clinicQO),
      context.queryClient.ensureQueryData(nextQO),
    ]);
  },
  component: HomePage,
});

function HomePage() {
  const { data } = useSuspenseQuery(clinicQO);
  const { data: nextData } = useSuspenseQuery(nextQO);
  const next = nextData.next;
  const getNextFn = useServerFn(getNextAvailable);

  // Per-doctor next available — fired in parallel inside cards using same query key
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-12 lg:pb-28 lg:pt-24">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Przyjmujemy nowe pacjentki
            </span>
            <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tightest text-foreground sm:text-5xl lg:text-[3.75rem]">
              Prywatna opieka ginekologiczna, której możesz zaufać.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Kompleksowa diagnostyka, konsultacje i opieka ginekologiczna w Krakowie i Zakopanem. Indywidualne podejście, doświadczeni specjaliści, komfort i pełna prywatność.
            </p>

            {next && (
              <div className="mt-7 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm shadow-soft">
                <CalendarCheck className="h-5 w-5 text-success" />
                <span className="text-muted-foreground">Najbliższy wolny termin:</span>
                <span className="font-display font-semibold text-foreground">{formatDateTimePL(next)}</span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
                <Link to="/umow-wizyte">Umów wizytę <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-6 text-base text-foreground hover:bg-surface-soft">
                <Link to="/zespol">Poznaj zespół</Link>
              </Button>
            </div>

            {/* Quick widget */}
            <div className="mt-10">
              <QuickBookingWidget doctors={data.doctors} locations={data.locations} />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <HeroIllustration className="h-auto w-full" />
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border px-0 sm:grid-cols-4">
            {[
              { k: "20+", v: "Lat doświadczenia" },
              { k: "10 000+", v: "Konsultacji rocznie" },
              { k: "98%", v: "Satysfakcji pacjentek" },
              { k: "2", v: "Eleganckie lokalizacje" },
            ].map((s) => (
              <div key={s.v} className="bg-surface px-6 py-7 text-center">
                <p className="font-display text-3xl font-semibold tracking-tightest text-foreground sm:text-4xl">{s.k}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS PREVIEW */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Zespół specjalistów</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Doświadczeni lekarze, z którymi naprawdę chcesz rozmawiać.
              </h2>
            </div>
            <Button asChild variant="outline" className="h-11 rounded-full px-5">
              <Link to="/zespol">Cały zespół <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.doctors.slice(0, 3).map((d) => (
              <DoctorCardWithNext key={d.id} doctor={d} getNextFn={getNextFn} />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES OVERVIEW */}
      <section className="border-t border-border bg-surface-soft py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Nasze usługi</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Pełen zakres nowoczesnej opieki ginekologicznej.
              </h2>
            </div>
            <Button asChild variant="ghost" className="h-11 rounded-full px-5 text-foreground hover:bg-surface">
              <Link to="/uslugi">Wszystkie usługi <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.slice(0, 6).map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Dlaczego Medical Clinic</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Sześć powodów, dla których kobiety wybierają naszą klinikę.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: HeartHandshake, t: "Indywidualne podejście", d: "Każda pacjentka prowadzona jest osobiście przez wybranego specjalistę." },
              { icon: Users, t: "Doświadczeni specjaliści", d: "Lekarze z wieloletnią praktyką i tytułem doktora nauk medycznych." },
              { icon: MapPin, t: "Dwie lokalizacje", d: "Eleganckie gabinety w Krakowie i Zakopanem — w godnych warunkach." },
              { icon: Clock, t: "Krótki czas oczekiwania", d: "Dzięki ograniczonej liczbie pacjentek terminy są krótkie i przewidywalne." },
              { icon: Sparkles, t: "Nowoczesna diagnostyka", d: "Najnowsze aparaty USG, kolposkopia i pełne pakiety profilaktyczne." },
              { icon: ShieldCheck, t: "Komfort i prywatność", d: "Spokojna atmosfera, dyskrecja i prawdziwa rozmowa z lekarzem." },
            ].map((f) => (
              <div key={f.t} className="rounded-3xl border border-border bg-surface p-7 shadow-soft">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/50 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="border-t border-border bg-surface-soft py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Nasze lokalizacje</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Spotkajmy się w Krakowie lub Zakopanem.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {data.locations.map((l) => (
              <LocationCard key={l.id} location={l} />
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection items={data.testimonials} />
      <FAQSection items={data.faqs} />

      {/* CLOSING CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="overflow-hidden rounded-4xl bg-primary px-8 py-14 text-primary-foreground shadow-elevated sm:px-12 lg:px-16 lg:py-20">
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Zarezerwuj wizytę w kilka chwil.
              </h2>
              <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
                Bez rejestracji i bez skierowań. Wystarczy imię, telefon i wybrany termin.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-7 text-base">
                  <Link to="/umow-wizyte">Umów wizytę <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function DoctorCardWithNext({
  doctor,
  getNextFn,
}: {
  doctor: Parameters<typeof DoctorCard>[0]["doctor"];
  getNextFn: ReturnType<typeof useServerFn<typeof getNextAvailable>>;
}) {
  const q = useSuspenseQuery(
    queryOptions({
      queryKey: ["next-available", "doctor", doctor.id],
      queryFn: () => getNextFn({ data: { doctorId: doctor.id, durationMin: 30, daysAhead: 21 } }),
    }),
  );
  return <DoctorCard doctor={doctor} nextAvailableISO={q.data.next} />;
}
