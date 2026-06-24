import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, X } from "lucide-react";
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
  joinWaitlist,
} from "@/lib/clinic.functions";
import {
  getMonthsAvailability,
  getAvailableDaysInMonth,
} from "@/lib/months.functions";

type Doctor = {
  id: string;
  full_name: string;
  title: string | null;
  specializations: string[];
  photo_url: string | null;
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

type MonthEntry = { year: number; month: number; label: string; availableCount: number };

function WaitlistModal({
  doctorId,
  locationId,
  serviceId,
  monthLabel,
  preferredFrom,
  preferredTo,
  onClose,
}: {
  doctorId: string;
  locationId: string;
  serviceId: string;
  monthLabel: string;
  preferredFrom: string;
  preferredTo: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const joinFn = useServerFn(joinWaitlist);
  const mut = useMutation({
    mutationFn: () =>
      joinFn({
        data: {
          doctorId,
          locationId,
          serviceId: serviceId || undefined,
          patientName: name.trim(),
          patientPhone: phone.trim(),
          preferredFrom,
          preferredTo,
        },
      }),
    onSuccess: () => setDone(true),
    onError: (e: Error) => setErr(e.message),
  });

  const valid = name.trim().length >= 2 && phone.trim().length >= 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-7 shadow-elevated">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-foreground">Lista oczekujących</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-soft">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div className="mt-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
              <Check className="h-6 w-6" />
            </div>
            <p className="mt-4 font-display text-base font-semibold text-foreground">Zostałaś zapisana!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Skontaktujemy się, gdy pojawi się wolny termin w {monthLabel}.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-6 h-11 w-full rounded-full">
              Zamknij
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Wpisz swoje dane — odezwiemy się, gdy zwolni się termin w <strong>{monthLabel}</strong>.
            </p>
            <div className="mt-5 space-y-3">
              <div>
                <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Imię i nazwisko <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 h-11 rounded-xl"
                  placeholder="Anna Kowalska"
                />
              </div>
              <div>
                <Label className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Telefon <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 h-11 rounded-xl"
                  placeholder="+48 600 000 000"
                />
              </div>
            </div>
            {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
            <Button
              onClick={() => mut.mutate()}
              disabled={!valid || mut.isPending}
              className="mt-5 h-11 w-full rounded-full"
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zapisz się na listę"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

const WEEKDAY_SHORT = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const WEEKDAY_FULL = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

function MonthCalendar({
  year,
  month,
  availableDays,
  selectedDay,
  onSelectDay,
  onWaitlistDay,
}: {
  year: number;
  month: number;
  availableDays: number[];
  selectedDay: number | null;
  onSelectDay: (d: number) => void;
  onWaitlistDay: (d: number) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const availSet = new Set(availableDays);

  // pad to Mon-start grid
  const offset = (firstDay + 6) % 7; // Mon=0, Tue=1, ... Sun=6

  return (
    <div className="rounded-2xl border border-border bg-surface-soft p-5">
      <div className="mb-3 grid grid-cols-7 gap-1">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d) => (
          <div key={d} className="py-1 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const date = new Date(year, month, d);
          const isPast = date <= today && date.toDateString() !== today.toDateString();
          const isAvailable = availSet.has(d);
          const isSelected = selectedDay === d;
          const isToday = date.toDateString() === today.toDateString();

          if (isPast) {
            return (
              <div
                key={d}
                className="aspect-square rounded-xl text-center text-sm leading-none"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span className="text-muted-foreground/30">{d}</span>
              </div>
            );
          }

          if (isAvailable) {
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelectDay(d)}
                className={cn(
                  "aspect-square rounded-xl text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "border border-primary/40 text-foreground hover:bg-accent/30"
                      : "text-foreground hover:bg-accent/40",
                )}
              >
                {d}
              </button>
            );
          }

          // Unavailable future day — show waitlist trigger
          return (
            <button
              key={d}
              type="button"
              onClick={() => onWaitlistDay(d)}
              title="Brak terminów — zapisz się na listę"
              className="aspect-square rounded-xl text-sm text-muted-foreground/50 hover:bg-surface hover:text-muted-foreground transition-colors"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BookingWizard({ doctors, locations, services, doctorLocations, initial }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [doctorId, setDoctorId] = useState<string>(initial?.doctor ?? "");
  const [locationId, setLocationId] = useState<string>(initial?.location ?? "");
  const [serviceId, setServiceId] = useState<string>(initial?.service ?? "");

  // Step 3 sub-state
  const [dateSubStep, setDateSubStep] = useState<"months" | "calendar">("months");
  const [selectedMonth, setSelectedMonth] = useState<MonthEntry | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [slotISO, setSlotISO] = useState<string>("");

  // Waitlist modal
  const [waitlistEntry, setWaitlistEntry] = useState<{
    month: MonthEntry;
    dayLabel?: string;
  } | null>(null);

  const [patient, setPatient] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  // Reset sub-step when entering step 3
  useEffect(() => {
    if (step === 3) {
      setDateSubStep("months");
      setSelectedMonth(null);
      setSelectedDay(null);
      setSlotISO("");
    }
  }, [step]);

  useEffect(() => {
    if (initial?.doctor) setStep((s) => Math.max(s, 1));
    if (initial?.location && initial?.doctor) setStep((s) => Math.max(s, 2));
    if (initial?.service && initial?.location) setStep((s) => Math.max(s, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doctor = doctors.find((d) => d.id === doctorId);
  const location = locations.find((l) => l.id === locationId);
  const service = services.find((s) => s.id === serviceId);
  const durationMin = service?.duration_min ?? 30;

  const availableLocations = useMemo(() => {
    if (!doctorId) return locations;
    const ids = new Set(doctorLocations.filter((dl) => dl.doctor_id === doctorId).map((dl) => dl.location_id));
    return locations.filter((l) => ids.has(l.id));
  }, [doctorId, doctorLocations, locations]);

  // Months availability query
  const monthsFn = useServerFn(getMonthsAvailability);
  const monthsQuery = useQuery({
    queryKey: ["months-avail", doctorId, locationId, durationMin],
    enabled: Boolean(doctorId && locationId && step === 3 && dateSubStep === "months"),
    queryFn: () => monthsFn({ data: { doctorId, locationId, durationMin } }),
  });

  // Days availability query for selected month
  const daysFn = useServerFn(getAvailableDaysInMonth);
  const daysQuery = useQuery({
    queryKey: ["days-avail", doctorId, locationId, selectedMonth?.year, selectedMonth?.month, durationMin],
    enabled: Boolean(doctorId && locationId && selectedMonth && dateSubStep === "calendar"),
    queryFn: () =>
      daysFn({
        data: {
          doctorId,
          locationId,
          year: selectedMonth!.year,
          month: selectedMonth!.month,
          durationMin,
        },
      }),
  });

  // Slots for the selected day
  const selectedDate = selectedMonth && selectedDay
    ? new Date(selectedMonth.year, selectedMonth.month, selectedDay)
    : null;

  const slotsFn = useServerFn(getAvailableSlots);
  const slotsQuery = useQuery({
    queryKey: ["slots", doctorId, locationId, serviceId, selectedDate ? toDateKey(selectedDate) : ""],
    enabled: Boolean(doctorId && locationId && serviceId && selectedDate),
    queryFn: () =>
      slotsFn({
        data: {
          doctorId,
          locationId,
          date: toDateKey(selectedDate!),
          durationMin,
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
    onSuccess: (r: { id: string }) => setConfirmedId(r.id),
  });

  const canNext = () => {
    if (step === 0) return Boolean(doctorId);
    if (step === 1) return Boolean(locationId);
    if (step === 2) return Boolean(serviceId);
    if (step === 3) return Boolean(slotISO);
    if (step === 4) return patientSchema.safeParse(patient).success;
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

  const back = () => {
    if (step === 3 && dateSubStep === "calendar") {
      setDateSubStep("months");
      setSelectedMonth(null);
      setSelectedDay(null);
      setSlotISO("");
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const openWaitlistForMonth = (m: MonthEntry) => {
    setWaitlistEntry({ month: m });
  };

  const openWaitlistForDay = (day: number) => {
    if (!selectedMonth) return;
    const date = new Date(selectedMonth.year, selectedMonth.month, day);
    setWaitlistEntry({
      month: selectedMonth,
      dayLabel: date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" }),
    });
  };

  const waitlistPreferredFrom = waitlistEntry
    ? new Date(waitlistEntry.month.year, waitlistEntry.month.month, 1).toISOString().split("T")[0]
    : "";
  const waitlistPreferredTo = waitlistEntry
    ? new Date(waitlistEntry.month.year, waitlistEntry.month.month + 1, 0).toISOString().split("T")[0]
    : "";

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
    <>
      {waitlistEntry && (
        <WaitlistModal
          doctorId={doctorId}
          locationId={locationId}
          serviceId={serviceId}
          monthLabel={waitlistEntry.month.label}
          preferredFrom={waitlistPreferredFrom}
          preferredTo={waitlistPreferredTo}
          onClose={() => setWaitlistEntry(null)}
        />
      )}

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
                    <MonogramAvatar name={d.full_name} photoUrl={d.photo_url} size="lg" />
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

        {/* Step 3: date and time — two sub-steps */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Sub-step A: month list */}
            {dateSubStep === "months" && (
              <>
                <StepHeading
                  title="Wybierz miesiąc"
                  desc="Wybierz miesiąc z dostępnymi terminami lub zapisz się na listę oczekujących."
                />
                {monthsQuery.isLoading ? (
                  <div className="grid h-48 place-items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(monthsQuery.data?.months ?? []).map((m) => {
                      const hasSlots = m.availableCount > 0;
                      return (
                        <div
                          key={`${m.year}-${m.month}`}
                          className={cn(
                            "rounded-2xl border p-5 transition-all",
                            hasSlots
                              ? "cursor-pointer border-border bg-surface hover:shadow-elevated"
                              : "border-border/50 bg-surface-soft opacity-70",
                          )}
                          onClick={() => {
                            if (hasSlots) {
                              setSelectedMonth(m);
                              setDateSubStep("calendar");
                            }
                          }}
                        >
                          <p className="font-display text-base font-semibold capitalize text-foreground">
                            {m.label}
                          </p>
                          {hasSlots ? (
                            <p className="mt-1 text-sm text-primary">
                              {m.availableCount}{" "}
                              {m.availableCount === 1 ? "wolny termin" : m.availableCount < 5 ? "wolne terminy" : "wolnych terminów"}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">Brak wolnych terminów</p>
                          )}
                          {!hasSlots && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openWaitlistForMonth(m);
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/20 transition-colors"
                            >
                              Zapisz się na listę oczekujących
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {(monthsQuery.data?.months ?? []).length === 0 && (
                      <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                        Brak dostępnych terminów. Skontaktuj się z recepcją.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Sub-step B: day calendar */}
            {dateSubStep === "calendar" && selectedMonth && (
              <>
                <StepHeading
                  title={`Wybierz dzień — ${selectedMonth.label}`}
                  desc="Kliknij dostępny dzień, aby zobaczyć godziny wizyt."
                />

                {daysQuery.isLoading ? (
                  <div className="grid h-48 place-items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <MonthCalendar
                    year={selectedMonth.year}
                    month={selectedMonth.month}
                    availableDays={daysQuery.data?.availableDays ?? []}
                    selectedDay={selectedDay}
                    onSelectDay={(d) => {
                      setSelectedDay(d);
                      setSlotISO("");
                    }}
                    onWaitlistDay={openWaitlistForDay}
                  />
                )}

                {/* Slots below calendar */}
                {selectedDay && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Dostępne godziny —{" "}
                      {new Date(selectedMonth.year, selectedMonth.month, selectedDay).toLocaleDateString("pl-PL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <div className="mt-3 min-h-[100px] rounded-2xl border border-border bg-surface-soft p-4">
                      {slotsQuery.isLoading ? (
                        <div className="grid h-20 place-items-center">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (slotsQuery.data?.slots.length ?? 0) === 0 ? (
                        <div className="grid h-20 place-items-center gap-2 text-center">
                          <p className="text-sm text-muted-foreground">Brak wolnych godzin tego dnia.</p>
                          <button
                            type="button"
                            onClick={() => openWaitlistForDay(selectedDay)}
                            className="text-xs font-medium text-primary underline underline-offset-2"
                          >
                            Zapisz się na listę oczekujących
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                          {(slotsQuery.data!.slots as string[]).map((iso: string) => (
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
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-primary/80" /> Dostępny
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-muted" /> Niedostępny (kliknij = lista oczekujących)
                  </span>
                </div>
              </>
            )}
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
            disabled={step === 0 && dateSubStep === "months"}
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
    </>
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
