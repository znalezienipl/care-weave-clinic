import { Link } from "@tanstack/react-router";

interface Props {
  email?: string | null;
  phone?: string | null;
}

export function SiteFooter({ email, phone }: Props) {
  return (
    <footer className="mt-24 border-t border-border bg-surface-soft">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-4 lg:px-12 lg:py-20">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-display text-base font-semibold tracking-tight">Medical Clinic</span>
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Specjalistyczny Gabinet Ginekologiczny. Prywatna, kompleksowa opieka ginekologiczna w Krakowie i Zakopanem —
            indywidualne podejście, nowoczesna diagnostyka, komfort i prywatność.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Klinika</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link to="/zespol" className="text-foreground hover:underline">Zespół</Link></li>
            <li><Link to="/uslugi" className="text-foreground hover:underline">Usługi</Link></li>
            <li><Link to="/cennik" className="text-foreground hover:underline">Cennik</Link></li>
            <li><Link to="/kontakt" className="text-foreground hover:underline">Kontakt</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kontakt</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {email && <li><a href={`mailto:${email}`} className="text-foreground hover:underline">{email}</a></li>}
            {phone && <li><a href={`tel:${phone.replace(/\s/g, "")}`} className="text-foreground hover:underline">{phone}</a></li>}
            <li className="text-muted-foreground">Kraków · ul. Retoryka 9/3</li>
            <li className="text-muted-foreground">Zakopane · ul. Tetmajera 7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <p>© {new Date().getFullYear()} Medical Clinic. Wszystkie prawa zastrzeżone.</p>
          <p>Specjalistyczny Gabinet Ginekologiczny</p>
        </div>
      </div>
    </footer>
  );
}
