import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Play, CheckCircle, Clock, AlertCircle, Loader2, CalendarDays, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTodayAppointments,
  startAppointment,
  completeAppointment,
  getDelayedAppointments,
  getWaitlist,
} from "@/lib/dashboard.functions";
import { formatTimePL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Panel lekarki — Medical Clinic" }],
  }),
  component: DashboardPage,
});

type Appointment = {
  id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  patient_name: string;
  patient_phone: string;
  started_at: string | null;
  notes: string | null;
  services: { name: string; duration_min: number } | null;
  locations: { name: string; city: string; address: string } | null;
  doctors: { full_name: string; title: string | null } | null;
  _isMock?: boolean;
};

type WaitlistEntry = {
  id: string;
  patient_name: string;
  patient_phone: string;
  preferred_from: string | null;
  preferred_to: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Zaplanowana",
  in_progress: "W trakcie",
  completed: "Zakończona",
  cancelled: "Odwołana",
  no_show: "Nieobecna",
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
  no_show: "bg-red-50 text-red-600 border-red-200",
};

function todayISO(h: number, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "mock-1",
    scheduled_at: todayISO(9, 0),
    duration_min: 45,
    status: "completed",
    patient_name: "Anna Kowalska",
    patient_phone: "+48 601 234 567",
    started_at: todayISO(9, 0),
    notes: null,
    services: { name: "Pełna wizyta ginekologiczna", duration_min: 45 },
    locations: { name: "Medical Clinic", city: "Kraków", address: "ul. Retoryka 9/3" },
    doctors: { full_name: "Marta Bałajewicz-Nowak", title: "Dr n.med." },
    _isMock: true,
  },
  {
    id: "mock-2",
    scheduled_at: todayISO(10, 0),
    duration_min: 30,
    status: "in_progress",
    patient_name: "Magdalena Wiśniewska",
    patient_phone: "+48 502 345 678",
    started_at: todayISO(10, 5),
    notes: null,
    services: { name: "USG ginekologiczne", duration_min: 30 },
    locations: { name: "Medical Clinic", city: "Kraków", address: "ul. Retoryka 9/3" },
    doctors: { full_name: "Marta Bałajewicz-Nowak", title: "Dr n.med." },
    _isMock: true,
  },
  {
    id: "mock-3",
    scheduled_at: todayISO(11, 0),
    duration_min: 15,
    status: "scheduled",
    patient_name: "Katarzyna Nowak",
    patient_phone: "+48 789 012 345",
    started_at: null,
    notes: "Pierwsza wizyta",
    services: { name: "Krótka konsultacja", duration_min: 15 },
    locations: { name: "Medical Clinic", city: "Kraków", address: "ul. Retoryka 9/3" },
    doctors: { full_name: "Marta Bałajewicz-Nowak", title: "Dr n.med." },
    _isMock: true,
  },
  {
    id: "mock-4",
    scheduled_at: todayISO(12, 15),
    duration_min: 45,
    status: "scheduled",
    patient_name: "Joanna Kwiatkowska",
    patient_phone: "+48 695 555 888",
    started_at: null,
    notes: null,
    services: { name: "Pełna wizyta ginekologiczna", duration_min: 45 },
    locations: { name: "Medical Clinic", city: "Kraków", address: "ul. Retoryka 9/3" },
    doctors: { full_name: "Marta Bałajewicz-Nowak", title: "Dr n.med." },
    _isMock: true,
  },
];

export default function DashboardPage() {
  const qc = useQueryClient();
  const [session, setSession] = useState<boolean | null>(null);

  // Check auth silently (for context only — dashboard accessible for demo)
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
      supabase.auth.onAuthStateChange((_e, s) => setSession(!!s));
    });
  }, []);

  const getApptsFn = useServerFn(getTodayAppointments);
  const startFn = useServerFn(startAppointment);
  const completeFn = useServerFn(completeAppointment);
  const delayFn = useServerFn(getDelayedAppointments);
  const getWaitlistFn = useServerFn(getWaitlist);

  const apptsQuery = useQuery({
    queryKey: ["today-appointments"],
    queryFn: async () => {
      if (!session) return [];
      try {
        return (await getApptsFn()) as Appointment[];
      } catch {
        return [] as Appointment[];
      }
    },
    enabled: session !== null,
    refetchInterval: 60_000,
  });

  const waitlistQuery = useQuery({
    queryKey: ["waitlist"],
    queryFn: () => getWaitlistFn(),
    refetchInterval: 120_000,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startFn({ data: { appointmentId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-appointments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeFn({ data: { appointmentId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-appointments"] }),
  });

  // Delay checker
  useEffect(() => {
    if (!session) return;
    const appts = apptsQuery.data as Appointment[] | undefined;
    const inProgress = appts?.find((a) => a.status === "in_progress" && !a._isMock);
    if (!inProgress) return;
    const doctorId = (inProgress as unknown as { doctor_id: string }).doctor_id;
    if (!doctorId) return;
    const timer = setInterval(async () => {
      await delayFn({ data: { doctorId } });
    }, 60_000);
    return () => clearInterval(timer);
  }, [session, apptsQuery.data, delayFn]);

  // Use real data if logged in and has appointments, otherwise show mock
  const realAppts = (apptsQuery.data ?? []) as Appointment[];
  const appts: Appointment[] = realAppts.length > 0 ? realAppts : MOCK_APPOINTMENTS;
  const isMockMode = realAppts.length === 0;

  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long",
  });

  const waitlistEntries = (waitlistQuery.data ?? []) as WaitlistEntry[];

  return (
    <div className="min-h-dvh bg-surface-soft">
      {/* Header */}
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Medical Clinic</p>
            <h1 className="font-display text-xl font-semibold text-foreground capitalize">{today}</h1>
          </div>
          <div className="flex items-center gap-3">
            {isMockMode && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Tryb demo
              </span>
            )}
            {session && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.signOut())}
              >
                Wyloguj
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-10">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {(["scheduled", "in_progress", "completed"] as const).map((s) => (
            <div key={s} className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="font-display text-2xl font-bold text-foreground">
                {appts.filter((a) => a.status === s).length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{STATUS_LABEL[s]}</p>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Wizyty dzisiaj {isMockMode && <span className="text-amber-600">(dane przykładowe)</span>}
          </h2>

          {apptsQuery.isLoading ? (
            <div className="grid h-40 place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {appts.map((apt) => {
                const isActive = apt.status === "in_progress";
                const isScheduled = apt.status === "scheduled";
                const elapsed = apt.started_at
                  ? Math.floor((Date.now() - new Date(apt.started_at).getTime()) / 60_000)
                  : 0;
                const overBy = isActive ? Math.max(0, elapsed - apt.duration_min) : 0;

                return (
                  <div
                    key={apt.id}
                    className={cn(
                      "rounded-2xl border bg-surface p-5 transition-shadow",
                      isActive ? "border-amber-300 shadow-md" : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimePL(apt.scheduled_at)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              STATUS_COLOR[apt.status] ?? "bg-gray-50 text-gray-500",
                            )}
                          >
                            {STATUS_LABEL[apt.status] ?? apt.status}
                          </span>
                          {overBy > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              +{overBy} min opóźnienia
                            </span>
                          )}
                        </div>
                        <p className="mt-2 font-display text-base font-semibold text-foreground">
                          {apt.patient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{apt.patient_phone}</p>
                        {apt.services && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {apt.services.name} · {apt.duration_min} min
                            {apt.locations && ` · ${apt.locations.city}`}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="mt-2 text-xs italic text-muted-foreground">{apt.notes}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        {isScheduled && !apt._isMock && (
                          <Button
                            size="sm"
                            className="gap-1.5 rounded-full"
                            disabled={startMutation.isPending}
                            onClick={() => startMutation.mutate(apt.id)}
                          >
                            {startMutation.isPending && startMutation.variables === apt.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                            Rozpocznij
                          </Button>
                        )}
                        {isActive && !apt._isMock && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-full"
                            disabled={completeMutation.isPending}
                            onClick={() => completeMutation.mutate(apt.id)}
                          >
                            {completeMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            Zakończ
                          </Button>
                        )}
                        {apt._isMock && (isScheduled || isActive) && (
                          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                            Demo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Waitlist section */}
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            Lista oczekujących
            {waitlistEntries.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {waitlistEntries.length}
              </span>
            )}
          </h2>

          {waitlistQuery.isLoading ? (
            <div className="grid h-24 place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : waitlistEntries.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
              Lista oczekujących jest pusta.
            </div>
          ) : (
            <div className="space-y-2">
              {waitlistEntries.map((w) => {
                const preferredLabel = w.preferred_from
                  ? new Date(w.preferred_from).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })
                  : null;
                return (
                  <div key={w.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="font-medium text-foreground">{w.patient_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{w.patient_phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {preferredLabel && (
                        <p className="text-xs text-muted-foreground capitalize">
                          Preferowany miesiąc: <strong className="text-foreground">{preferredLabel}</strong>
                        </p>
                      )}
                      <p className="mt-0.5 text-[0.65rem] text-muted-foreground/60">
                        {new Date(w.created_at).toLocaleDateString("pl-PL", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
