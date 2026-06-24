import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Strona główna" },
  { to: "/zespol", label: "Zespół" },
  { to: "/uslugi", label: "Usługi" },
  { to: "/cennik", label: "Cennik" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent transition-all",
        scrolled ? "bg-background/85 backdrop-blur-md border-border/60" : "bg-background/60 backdrop-blur",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Medical Clinic — strona główna">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10z" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold tracking-tight text-foreground">Medical Clinic</span>
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Gabinet ginekologiczny</span>
          </span>
        </Link>

        <nav aria-label="Główna nawigacja" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 rounded-full px-3 text-muted-foreground lg:inline-flex">
            <Link to="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Panel
            </Link>
          </Button>
          <Button asChild size="lg" className="hidden h-11 rounded-full px-6 lg:inline-flex">
            <Link to="/umow-wizyte">Umów wizytę</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Zamknij menu" : "Otwórz menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-foreground lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav aria-label="Menu mobilne" className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-surface-soft"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-foreground hover:bg-surface-soft"
            >
              <LayoutDashboard className="h-4 w-4" /> Panel lekarki
            </Link>
            <Button asChild size="lg" className="mt-2 h-12 rounded-full">
              <Link to="/umow-wizyte">Umów wizytę</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
