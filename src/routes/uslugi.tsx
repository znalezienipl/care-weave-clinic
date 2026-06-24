import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ServiceCard } from "@/components/site/ServiceCard";
import { getClinicData } from "@/lib/clinic.functions";

const qo = queryOptions({ queryKey: ["clinic"], queryFn: () => getClinicData() });

export const Route = createFileRoute("/uslugi")({
  head: () => ({
    meta: [
      { title: "Usługi — Medical Clinic" },
      { name: "description", content: "Pełen zakres usług ginekologicznych: konsultacje, diagnostyka, USG, profilaktyka, ginekologia onkologiczna." },
      { property: "og:title", content: "Usługi — Medical Clinic" },
      { property: "og:description", content: "Konsultacje, diagnostyka, USG, profilaktyka i ginekologia onkologiczna." },
      { property: "og:url", content: "/uslugi" },
    ],
    links: [{ rel: "canonical", href: "/uslugi" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: ServicesPage,
});

function ServicesPage() {
  const { data } = useSuspenseQuery(qo);
  const byCategory = data.services.reduce<Record<string, typeof data.services>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});
  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Katalog usług</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Kompleksowa, nowoczesna opieka ginekologiczna.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Konsultacje, diagnostyka, USG, profilaktyka oraz ginekologia onkologiczna — wszystko w jednym miejscu.
        </p>
      </div>

      <div className="mt-16 space-y-16">
        {Object.entries(byCategory).map(([cat, list]) => (
          <section key={cat}>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{cat}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <ServiceCard key={s.id} service={s} showPrice />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
