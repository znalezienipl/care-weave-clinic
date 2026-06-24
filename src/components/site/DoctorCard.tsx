import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import { MonogramAvatar } from "./MonogramAvatar";
import { Button } from "@/components/ui/button";
import { formatDateTimePL } from "@/lib/format";

interface Doctor {
  id: string;
  full_name: string;
  title: string | null;
  specializations: string[];
  bio: string | null;
  availability_status: "accepting" | "limited" | "unavailable";
}

export function AvailabilityBadge({ status }: { status: Doctor["availability_status"] }) {
  if (status === "accepting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" /> Przyjmuje nowych pacjentów
      </span>
    );
  }
  if (status === "limited") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground">
        Ograniczona dostępność
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      Tymczasowo niedostępny
    </span>
  );
}

interface Props {
  doctor: Doctor;
  nextAvailableISO?: string | null;
  variant?: "compact" | "full";
}

export function DoctorCard({ doctor, nextAvailableISO, variant = "compact" }: Props) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-soft transition-shadow hover:shadow-elevated">
      <div className="flex items-start gap-5">
        <MonogramAvatar name={doctor.full_name} size={variant === "full" ? "xl" : "lg"} tone="accent" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{doctor.title ?? "Lekarz"}</p>
          <h3 className="mt-1.5 font-display text-xl font-semibold leading-tight text-foreground">{doctor.full_name}</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {doctor.specializations.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {doctor.bio && variant === "compact" && (
        <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
      )}

      <div className="mt-5">
        <AvailabilityBadge status={doctor.availability_status} />
      </div>

      <div className="mt-6 rounded-2xl bg-surface-soft px-4 py-3.5">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">Najbliższy wolny termin</p>
        <p className="mt-1 font-display text-[0.95rem] font-semibold text-foreground">
          {nextAvailableISO ? formatDateTimePL(nextAvailableISO) : "Skontaktuj się z recepcją"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 pt-1">
        <Button asChild className="h-11 rounded-full px-5">
          <Link to="/umow-wizyte" search={{ doctor: doctor.id } as never}>
            <Calendar className="h-4 w-4" /> Umów wizytę
          </Link>
        </Button>
        {variant === "compact" && (
          <Button asChild variant="ghost" className="h-11 rounded-full px-4 text-foreground hover:bg-surface-soft">
            <Link to="/zespol">
              Zobacz profil <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
