import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { LogOut, Play, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  getTodayAppointments,
  startAppointment,
  completeAppointment,
  getDelayedAppointments,
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

function LoginWall() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-soft px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-elevated">
        <h1 className="font-display text-2xl font-semibold text-foreground">Panel lekarki</h1>
        <p className="mt-1 text-sm text-muted-foreground">Medical Clinic — dostęp chroniony</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Hasło
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zaloguj się"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [session, setSession] = useState<{ user: { id: string } } | null | undefined>(undefined);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Check auth client-side
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const getApptsFn = useServerFn(getTodayAppointments);
  const startFn = useServerFn(startAppointment);
  const completeFn = useServerFn(completeAppointment);
  const delayFn = useServerFn(getDelayedAppointments);

  const apptsQuery = useQuery({
    queryKey: ["today-appointments"],
    queryFn: () => getApptsFn(),
    enabled: !!session,
    refetchInterval: 60_000,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startFn({ data: { appointmentId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-appointments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeFn({ data: { appointmentId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-appointments"] }),
  });

  // Delay checker — runs every 60s when there's an in_progress appointment
  useEffect(() => {
    if (!session) return;
    const appts = apptsQuery.data as Appointment[] | undefined;
    const hasInProgress = appts?.some((a) => a.status === "in_progress");
    if (!hasInProgress) return;

    const inProgress = appts?.find((a) => a.status === "in_progress");
    if (!inProgress?.doctors) return;

    const doctorId = (inProgress as unknown as { doctor_id: string }).doctor_id;
    if (!doctorId) return;

    const timer = setInterval(async () => {
      await delayFn({ data: { doctorId } });
    }, 60_000);
    return () => clearInterval(timer);
  }, [session, apptsQuery.data, delayFn]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // Loading state
  if (session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in
  if (!session) return <LoginWall />;

  const appts = (apptsQuery.data ?? []) as Appointment[];
  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="min-h-dvh bg-surface-soft">
      {/* Header */}
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Medical Clinic</p>
            <h1 className="font-display text-xl font-semibold text-foreground capitalize">{today}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" /> Wyloguj
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {(["scheduled", "in_progress", "completed"] as const).map((s) => (
            <div key={s} className="rounded-2xl border border-border bg-surface p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">
                {appts.filter((a) => a.status === s).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{STATUS_LABEL[s]}</p>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Wizyty dzisiaj
        </h2>

        {apptsQuery.isLoading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : appts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-muted-foreground text-sm">
            Brak wizyt na dziś.
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600">
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
                        <p className="mt-2 text-xs text-muted-foreground italic">{apt.notes}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      {isScheduled && (
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
                      {isActive && (
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
