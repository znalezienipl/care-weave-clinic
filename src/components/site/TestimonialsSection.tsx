import { Star } from "lucide-react";
import { MonogramAvatar } from "./MonogramAvatar";

interface Testimonial {
  id: string;
  author: string;
  content: string;
  rating: number;
}

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-border bg-surface-soft py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Opinie pacjentek</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Wybierają nas kobiety, którym zależy na spokoju i zaufaniu.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <figure key={t.id} className="flex h-full flex-col rounded-3xl border border-border bg-surface p-7 shadow-soft">
              <div className="flex items-center gap-1 text-accent-foreground">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                „{t.content}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <MonogramAvatar name={t.author} size="sm" tone="muted" />
                <span className="text-sm font-medium text-foreground">{t.author}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
