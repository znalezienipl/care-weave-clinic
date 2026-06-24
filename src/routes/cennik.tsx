import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClinicData } from "@/lib/clinic.functions";
import { formatPLN } from "@/lib/format";

const qo = queryOptions({ queryKey: ["clinic"], queryFn: () => getClinicData() });

export const Route = createFileRoute("/cennik")({
  head: () => ({
    meta: [
      { title: "Cennik — Medical Clinic" },
      { name: "description", content: "Aktualny cennik usług ginekologicznych w Medical Clinic — Kraków i Zakopane." },
      { property: "og:title", content: "Cennik — Medical Clinic" },
      { property: "og:description", content: "Cennik konsultacji, USG i diagnostyki." },
      { property: "og:url", content: "/cennik" },
    ],
    links: [{ rel: "canonical", href: "/cennik" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: PricingPage,
});

function PricingPage() {
  const { data } = useSuspenseQuery(qo);
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Cennik</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Przejrzyste ceny, bez ukrytych kosztów.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Płacisz tylko za wybraną wizytę. Cena obejmuje konsultację i dokumentację.
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
        <ul className="divide-y divide-border">
          {data.services.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.category}</p>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">{s.name}</p>
                {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
              </div>
              <div className="flex items-center gap-6">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {s.duration_min} min
                </span>
                <span className="font-display text-xl font-semibold text-foreground">{formatPLN(s.price_pln)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex justify-center">
        <Button asChild size="lg" className="h-12 rounded-full px-7">
          <Link to="/umow-wizyte">Umów wizytę</Link>
        </Button>
      </div>
    </div>
  );
}
