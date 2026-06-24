import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Doctor { id: string; full_name: string }
interface Location { id: string; city: string }

interface Props {
  doctors: Doctor[];
  locations: Location[];
}

export function QuickBookingWidget({ doctors, locations }: Props) {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const search: Record<string, string> = {};
    if (doctor) search.doctor = doctor;
    if (location) search.location = location;
    navigate({ to: "/umow-wizyte", search: search as never });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-surface p-3 shadow-elevated sm:p-4"
      aria-label="Szybka rezerwacja wizyty"
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:gap-3">
        <label className="flex flex-col gap-1 rounded-2xl bg-surface-soft px-4 py-3">
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Lekarz</span>
          <select
            aria-label="Wybierz lekarza"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground outline-none"
          >
            <option value="">Dowolny lekarz</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 rounded-2xl bg-surface-soft px-4 py-3">
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Lokalizacja</span>
          <select
            aria-label="Wybierz lokalizację"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-transparent text-sm font-medium text-foreground outline-none"
          >
            <option value="">Wszystkie</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.city}</option>
            ))}
          </select>
        </label>
        <Button type="submit" size="lg" className="h-auto rounded-2xl px-6 py-4 sm:py-0">
          <Search className="h-4 w-4" /> Znajdź termin
        </Button>
      </div>
    </form>
  );
}
