import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getClinicData } from "@/lib/clinic.functions";

const qo = queryOptions({ queryKey: ["clinic"], queryFn: () => getClinicData() });

const search = z.object({
  doctor: z.string().uuid().optional(),
  location: z.string().uuid().optional(),
  service: z.string().uuid().optional(),
});

export const Route = createFileRoute("/umow-wizyte")({
  head: () => ({
    meta: [
      { title: "Umów wizytę — Medical Clinic" },
      { name: "description", content: "Zarezerwuj wizytę online — wybierz lekarza, lokalizację, usługę i termin w kilka kroków." },
      { property: "og:title", content: "Umów wizytę — Medical Clinic" },
      { property: "og:description", content: "Rezerwacja online bez rejestracji." },
      { property: "og:url", content: "/umow-wizyte" },
    ],
    links: [{ rel: "canonical", href: "/umow-wizyte" }],
  }),
  validateSearch: (s) => search.parse(s),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: BookingPage,
});

function BookingPage() {
  const { data } = useSuspenseQuery(qo);
  const initial = Route.useSearch();
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Rezerwacja</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Umów wizytę w kilka kroków.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Bez rejestracji i bez skierowania. Otrzymasz SMS-em potwierdzenie oraz przypomnienia.
        </p>
      </div>
      <div className="mt-10">
        <BookingWizard
          doctors={data.doctors}
          locations={data.locations}
          services={data.services}
          doctorLocations={data.doctorLocations}
          initial={initial}
        />
      </div>
    </div>
  );
}
