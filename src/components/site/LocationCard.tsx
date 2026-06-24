import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Location {
  id: string;
  name: string;
  city: string;
  address: string;
  hours: unknown;
}

function hoursList(hours: unknown): Array<[string, string]> {
  if (!hours || typeof hours !== "object") return [];
  return Object.entries(hours as Record<string, string>);
}

export function LocationCard({ location }: { location: Location }) {
  const hrs = hoursList(location.hours);
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
      {/* Map placeholder: stylized topographic SVG */}
      <div className="relative h-44 w-full bg-surface-soft">
        <svg viewBox="0 0 600 200" className="h-full w-full" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${30 + i * 18} Q150 ${10 + i * 18} 300 ${40 + i * 18} T600 ${20 + i * 18}`}
              fill="none"
              stroke="oklch(0.55 0.035 230)"
              strokeOpacity={0.12}
              strokeWidth="1"
            />
          ))}
          <circle cx="300" cy="100" r="14" fill="oklch(0.36 0.04 235)" />
          <circle cx="300" cy="100" r="34" fill="none" stroke="oklch(0.36 0.04 235 / 0.25)" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="p-7">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Lokalizacja</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">{location.city}</h3>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {location.address}
        </p>
        {hrs.length > 0 && (
          <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-xs">
            {hrs.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="font-medium uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="font-display text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <Button asChild className="mt-6 h-11 w-full rounded-full sm:w-auto">
          <Link to="/umow-wizyte" search={{ location: location.id } as never}>
            Umów wizytę w tej lokalizacji
          </Link>
        </Button>
      </div>
    </article>
  );
}
