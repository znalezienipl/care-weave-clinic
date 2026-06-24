import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export function FAQSection({ items }: { items: FAQ[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-20 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_2fr] lg:px-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Najczęstsze pytania</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Wszystko, o co najczęściej pytają pacjentki.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Nie znalazłaś odpowiedzi? Skontaktuj się z recepcją — pomożemy wybrać właściwą wizytę i przygotować się do niej.
          </p>
        </div>
        <div>
          <Accordion type="single" collapsible className="rounded-3xl border border-border bg-surface px-6 shadow-soft">
            {items.map((f) => (
              <AccordionItem key={f.id} value={f.id} className="border-b border-border/70 last:border-0">
                <AccordionTrigger className="py-5 text-left font-display text-base font-semibold text-foreground hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
