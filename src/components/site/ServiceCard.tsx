import { Link } from "@tanstack/react-router";
import { Clock, ChevronRight } from "lucide-react";
import { formatPLN } from "@/lib/format";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_min: number;
  price_pln: number | string | null;
}

export function ServiceCard({ service, showPrice = false }: { service: Service; showPrice?: boolean }) {
  return (
    <article className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-soft transition-shadow hover:shadow-elevated">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{service.category}</p>
      <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-foreground">{service.name}</h3>
      {service.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
      )}
      <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> {service.duration_min} min
        </span>
        {showPrice && service.price_pln != null && (
          <span className="font-display text-foreground">{formatPLN(service.price_pln)}</span>
        )}
      </div>
      <div className="mt-6 pt-1">
        <Button asChild variant="ghost" className="h-11 rounded-full px-4 text-foreground hover:bg-surface-soft">
          <Link to="/umow-wizyte" search={{ service: service.id } as never}>
            Umów <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
