import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, MapPin } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonogramAvatar } from "@/components/site/MonogramAvatar";
import { cn } from "@/lib/utils";
import { formatDatePL, formatPLN, formatTimePL, toDateKey } from "@/lib/format";
import {
  createAppointment,
  getAvailableSlots,
} from "@/lib/clinic.functions";

type Doctor = {
  id: string;
  full_name: string;
  title: string | null;
  specializations: string[];
  availability_status: "accepting" | "limited" | "unavailable";
};
type Location = { id: string; city: string; address: string };
type Service = { id: string; name: string; duration_min: number; price_pln: number | string | null };
type DoctorLocation = { doctor_id: string; location_id: string };

interface Props {
  doctors: Doctor[];
  locations: Location[];
  services: Service[];
  doctorLocations: DoctorLocation[];
  initial?: { doctor?: string; location?: string; service?: string };
}

const STEPS = ["Lekarz", "Lokalizacja", "Usługa", "Termin", "Dane", "Potwierdzenie"];

const patientSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  phone: z.string().trim().min(6, "Podaj numer telefonu").max(20),
  email: z.string().trim().email("Nieprawidłowy email").max(255).optional().or(z.literal("")),
});

export function BookingWizard({ doctors, locations, services, doctorLocations, initial }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [doctorId, setDoctorId] = useState<string>(initial?.doctor ?? "");
  const [locationId, setLocationId] = useState<string>(initial?.location ?? "");
  const [serviceId, setServiceId] = useState<string>(initial?.service ?? "");
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slotISO, setSlotISO] = useState<string>("");
  const [patient, setPatient] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  // Skip step 0 if doctor pre-chosen via search params (but keep visible progress)
  useEffect(() => {
    if (initial?.doctor) setStep((s) => Math.max(s, 1));
    if (initial?.location && initial?.doctor) setStep((s) => Math.max(s, 2));
    if (initial?.service && initial?.location) setStep((s) => Math.max(s, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doctor = doctors.find((d) => d.id === doctorId);
  const location = locations.find((l) => l.id === locationId);
  const service = services.find((s) => s.id === serviceId);

  const availableLocations = useMemo(() => {
    if (!doctorId) return locations;
    const ids = new Set(doctorLocations.filter((dl) => dl.doctor_id === doctorId).map((dl) => dl.location_id));
    return locations.filter((l) => ids.has(l.id));
  }, [doctorId, doctorLocations, locations]);

  const slotsFn = useServerFn(getAvailableSlots);
  const slotsQuery = useQuery({
    queryKey: ["slots", doctorId, locationId, serviceId, toDateKey(date)],
    enabled: Boolean(doctorId && locationId && serviceId && step === 3),
    queryFn: () =>
      slotsFn({
        data: {
          doctorId,
          locationId,
          date: toDateKey(date),
          durationMin: service?.duration_min ?? 30,
        },
      }),
  });

  const createFn = useServerFn(createAppointment);
  const submitMutation = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          doctorId,
          locationId,
          serviceId,
          scheduledAt: slotISO,
          patientName: patient.name,
          patientPhone: patient.phone,
          patientEmail: patient.email || undefined,
        },
      }),
    onSuccess: (r) => setConfirmedId(r.id),
  });

  const canNext = () => {
    if (step === 0) return Boolean(doctorId);
    if (step === 1) return Boolean(locationId);
    if (step === 2) return Boolean(serviceId);
    if (step === 3) return Boolean(slotISO);
    if (step === 4) {
      const r = patientSchema.safeParse(patient);
      return r.success;
    }
    return true;
  };

  const next = () => {
    if (step === 4) {
      const r = patientSchema.safeParse(patient);
      if (!r.success) {
        setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
        return;
      }
      setErrors({});
    }
    setStep((s) => Math.min(s + 1, 5));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Step 3 — date strip (next 14 days)
  const dateStrip = useMemo(() => {
    const days: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  if (confirmedId) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-10 text-center shadow-elevated">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
          <Check className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-semibold text-foreground">Wizyta została zarezerwowana</h2>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          Wyślemy SMS-em potwierdzenie oraz przypomnienia na 48, 24 i 2 godziny przed wizytą.
        </p>
        <dl className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl bg-surface-soft p-5 text-left text-sm">
          <Row label="Lekarz" value={doctor ? `${doctor.title ?? ""} ${doctor.full_name}` : ""} />
          <Row label="Lokalizacja" value={location ? `${location.city} · ${location.address}` : ""} />
          <Row label="Usługa" value={service?.name ?? ""} />
          <Row label="Termin" value={slotISO ? `${formatDatePL(slotISO)} · ${formatTimePL(slotISO)}` : ""} />
          <Row label="Pacjentka" value={patient.name} />
        </dl>
        <Button onClick={() => navigate({ to: "/" })} variant="outline" className="mt-8 h-11 rounded-full px-6">
          Wróć na stronę główną
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-10">
      {/* Progress */}
      <ol className="mb-10 flex items-center gap-2 overflow-x-auto" aria-label="Postęp rezerwacji">
        {STEPS.map((label, i) => (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full text-xs font-semibold",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-foreground text-background"
                    : "bg-surface-soft text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:inline", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" />}
          </li>
        ))}
      </ol>

      {/* Step 0: doctor */}
      {step === 0 && (
        <div className="space-y-4">
          <StepHeading title="Wybierz lekarza" desc="Każdy z naszych specjalistów dobiera plan opieki indywidualnie." />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => { setDoctorId(d.id); setLocationId(""); }}
                className={cn(
                  "rounded-3xl border bg-surface p-6 text-left transition-all hover:shadow-elevated",
                  doctorId === d.id ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <div className="flex items-start gap-4">
                  <MonogramAvatar name={d.full_name} size="lg" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{d.title}</p>
                    <p className="mt-1 font-display text-lg font-semibold text-foreground">{d.full_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{d.specializations[0]}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: location */}
      {step === 1 && (
        <div className="space-y-4">
          <StepHeading title="Wybierz lokalizację" desc="Dwie eleganckie lokalizacje — Kraków i Zakopane." />
          <div className="grid gap-4 sm:grid-cols-2">
            {availableLocations.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLocationId(l.id)}
                className={cn(
                  "rounded-3xl border bg-surface p-6 text-left transition-all hover:shadow-elevated",
                  locationId === l.id ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <MapPin className="h-5 w-5 text-primary" />
                <p className="mt-4 font-display text-xl font-semibold text-foreground">{l.city}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l.address}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: service */}
      {step === 2 && (
        <div className="space-y-4">
          <StepHeading title="Wybierz rodzaj wizyty" desc="Czas trwania i cena będą uwzględnione w rezerwacji." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={cn(
                  "rounded-3xl border bg-surface p-6 text-left transition-all hover:shadow-elevated",
                  serviceId === s.id ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <p className="font-display text-lg font-semibold text-foreground">{s.name}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" /> {s.duration_min} min
                  </span>
                  <span className="font-display font-semibold text-foreground">{formatPLN(s.price_pln)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: date and time */}
      {step === 3 && (
        <div className="space-y-6">
          <StepHeading title="Wybierz termin" desc="Pokażemy dostępne sloty dla wybranego lekarza i lokalizacji." />
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
            {dateStrip.map((d) => {
              const active = toDateKey(d) === toDateKey(date);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => { setDate(d); setSlotISO(""); }}
                  className={cn(
                    "min-w-[68px] shrink-0 rounded-2xl border px-3 py-3 text-center transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-soft",
                  )}
                >
                  <p className="text-[0.65rem] font-medium uppercase tracking-wider">
                    {d.toLocaleDateString("pl-PL", { weekday: "short" })}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold">{d.getDate()}</p>
                  <p className="text-[0.65rem] uppercase">
                    {d.toLocaleDateString("pl-PL", { month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Dostępne godziny — {formatDatePL(date.toISOString())}
            </p>
            <div className="mt-3 min-h-[120px] rounded-2xl border border-border bg-surface-soft p-4">
              {slotsQuery.isLoading ? (
                <div className="grid h-24 place-items-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (slotsQuery.data?.slots.length ?? 0) === 0 ? (
                <p className="grid h-24 place-items-center text-sm text-muted-foreground">
                  Brak wolnych terminów tego dnia.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {slotsQuery.data!.slots.map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSlotISO(iso)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        slotISO === iso
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-foreground hover:bg-accent/40",
                      )}
                    >
                      {formatTimePL(iso)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: patient data */}
      {step === 4 && (
        <div className="space-y-4">
          <StepHeading title="Twoje dane" desc="Bez rejestracji. Wystarczy imię, nazwisko i telefon." />
          <div className="grid max-w-xl gap-4">
            <Field
              label="Imię i nazwisko"
              required
              value={patient.name}
              onChange={(v) => setPatient((p) => ({ ...p, name: v }))}
              error={errors.name}
            />
            <Field
              label="Numer telefonu"
              required
              type="tel"
              autoComplete="tel"
              value={patient.phone}
              onChange={(v) => setPatient((p) => ({ ...p, phone: v }))}
              error={errors.phone}
            />
            <Field
              label="Email (opcjonalnie)"
              type="email"
              autoComplete="email"
              value={patient.email}
              onChange={(v) => setPatient((p) => ({ ...p, email: v }))}
              error={errors.email}
            />
          </div>
        </div>
      )}

      {/* Step 5: confirm */}
      {step === 5 && (
        <div className="space-y-4">
          <StepHeading title="Potwierdź rezerwację" desc="Sprawdź szczegóły poniżej i potwierdź." />
          <dl className="grid max-w-xl gap-3 rounded-2xl bg-surface-soft p-6 text-sm">
            <Row label="Lekarz" value={doctor ? `${doctor.title ?? ""} ${doctor.full_name}` : ""} />
            <Row label="Lokalizacja" value={location ? `${location.city} · ${location.address}` : ""} />
            <Row label="Usługa" value={service ? `${service.name} (${service.duration_min} min)` : ""} />
            <Row label="Termin" value={slotISO ? `${formatDatePL(slotISO)} · ${formatTimePL(slotISO)}` : ""} />
            <Row label="Pacjentka" value={patient.name} />
            <Row label="Telefon" value={patient.phone} />
            {patient.email && <Row label="Email" value={patient.email} />}
            {service?.price_pln != null && <Row label="Cena" value={formatPLN(service.price_pln)} />}
          </dl>
          {submitMutation.error && (
            <p className="text-sm text-destructive">
              {(submitMutation.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Nav */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={back}
          disabled={step === 0}
          className="h-11 rounded-full px-4 text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Wstecz
        </Button>
        {step < 5 ? (
          <Button
            type="button"
            onClick={next}
            disabled={!canNext()}
            className="h-12 rounded-full px-6"
          >
            Dalej <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="h-12 rounded-full px-6"
          >
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Potwierdź wizytę
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">{desc}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-display text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Field({
  label, value, onChange, required, type = "text", autoComplete, error,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  type?: string; autoComplete?: string; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}{required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-2xl border-border bg-surface px-4 text-base"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
