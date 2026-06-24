import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { GraduationCap, Award, Stethoscope } from "lucide-react";
import { MonogramAvatar } from "@/components/site/MonogramAvatar";
import { AvailabilityBadge } from "@/components/site/DoctorCard";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { getClinicData } from "@/lib/clinic.functions";

const qo = queryOptions({ queryKey: ["clinic"], queryFn: () => getClinicData() });

export const Route = createFileRoute("/zespol")({
  head: () => ({
    meta: [
      { title: "Zespół specjalistów — Medical Clinic" },
      { name: "description", content: "Poznaj zespół Medical Clinic — doświadczonych specjalistów ginekologii i ginekologii onkologicznej w Krakowie i Zakopanem." },
      { property: "og:title", content: "Zespół specjalistów — Medical Clinic" },
      { property: "og:description", content: "Doświadczeni specjaliści ginekologii i ginekologii onkologicznej." },
      { property: "og:url", content: "/zespol" },
    ],
    links: [{ rel: "canonical", href: "/zespol" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: TeamPage,
});

function TeamPage() {
  const { data } = useSuspenseQuery(qo);
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Nasz zespół</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Lekarze, którym pacjentki naprawdę ufają.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Każdy z naszych specjalistów łączy wieloletnie doświadczenie kliniczne z indywidualnym podejściem do pacjentki — wybierz lekarza, z którym chcesz porozmawiać.
        </p>
      </div>

      <div className="mt-16 space-y-10">
        {data.doctors.map((d) => (
          <article key={d.id} className="grid gap-8 rounded-3xl border border-border bg-surface p-7 shadow-soft sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <MonogramAvatar name={d.full_name} size="xl" tone="accent" />
              <div className="mt-5">
                <AvailabilityBadge status={d.availability_status} />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{d.title}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">{d.full_name}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {d.specializations.map((s) => (
                  <li key={s} className="rounded-full bg-surface-soft px-3 py-1 text-xs font-medium text-foreground">{s}</li>
                ))}
              </ul>
              {d.bio && <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{d.bio}</p>}

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {d.education && (
                  <InfoBlock icon={GraduationCap} title="Wykształcenie" content={d.education} />
                )}
                {d.certificates && (
                  <InfoBlock icon={Award} title="Certyfikaty" content={d.certificates} />
                )}
                {d.expertise.length > 0 && (
                  <InfoBlock icon={Stethoscope} title="Obszary" content={d.expertise.join(", ")} />
                )}
              </div>
            </div>

            <div className="flex items-start justify-start lg:justify-end">
              <Button asChild className="h-12 rounded-full px-6">
                <Link to="/umow-wizyte" search={{ doctor: d.id } as never}>Umów wizytę</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, content }: { icon: typeof GraduationCap; title: string; content: string }) {
  return (
    <div className="rounded-2xl bg-surface-soft p-4">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-4 w-4" />
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{content}</p>
    </div>
  );
}
