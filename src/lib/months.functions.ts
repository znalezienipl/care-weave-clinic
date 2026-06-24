import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// Demo overrides — hardcoded for the clinic's 2026 summer schedule
const DEMO_COUNT: Record<string, number> = {
  "2026-7": 4,  // lipiec: ograniczona dostępność
  "2026-8": 0,  // sierpień: urlop
};

const DEMO_DAYS: Record<string, number[]> = {
  "2026-7": [1, 8, 15, 22],  // cztery konkretne środy lipca
  "2026-8": [],
};

// Month key: "${year}-${month+1}" (1-indexed)
function demoKey(year: number, month: number) {
  return `${year}-${month + 1}`;
}

const monthsInput = z.object({
  doctorId: z.string().uuid(),
  locationId: z.string().uuid(),
  durationMin: z.number().int().min(5).max(240),
});

export const getMonthsAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => monthsInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: avail } = await sb
      .from("availability")
      .select("*")
      .eq("doctor_id", data.doctorId)
      .eq("location_id", data.locationId);

    const now = new Date();
    // Start from next month
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const windowEnd = new Date(start.getFullYear(), start.getMonth() + 6, 1);

    const { data: allAppts } = await supabaseAdmin
      .from("appointments")
      .select("scheduled_at, duration_min")
      .eq("doctor_id", data.doctorId)
      .gte("scheduled_at", start.toISOString())
      .lt("scheduled_at", windowEnd.toISOString())
      .neq("status", "cancelled");

    const allBusy = (allAppts ?? []).map((a) => ({
      s: new Date(a.scheduled_at).getTime(),
      e: new Date(a.scheduled_at).getTime() + a.duration_min * 60_000,
    }));

    const months: Array<{ year: number; month: number; label: string; availableCount: number }> = [];

    for (let m = 0; m < 6; m++) {
      const year = start.getFullYear() + Math.floor((start.getMonth() + m) / 12);
      const month = (start.getMonth() + m) % 12;
      const label = new Date(year, month, 1).toLocaleDateString("pl-PL", {
        month: "long",
        year: "numeric",
      });
      const dk = demoKey(year, month);

      if (dk in DEMO_COUNT) {
        months.push({ year, month, label, availableCount: DEMO_COUNT[dk] });
        continue;
      }

      if (!avail || avail.length === 0) {
        months.push({ year, month, label, availableCount: 0 });
        continue;
      }

      const monthEnd = new Date(year, month + 1, 0).getDate();
      const weekdaysPresent = new Set(avail.map((a) => a.weekday));
      let total = 0;

      for (let d = 1; d <= monthEnd; d++) {
        const day = new Date(year, month, d);
        if (day.getTime() <= now.getTime()) continue;
        const wd = day.getDay();
        if (!weekdaysPresent.has(wd)) continue;

        const blocks = avail.filter((a) => a.weekday === wd);
        const seen = new Set<number>();

        for (const block of blocks) {
          const [sh, sm] = block.start_time.split(":").map(Number);
          const [eh, em] = block.end_time.split(":").map(Number);
          const step = block.slot_minutes;
          const s0 = new Date(year, month, d, sh, sm, 0, 0).getTime();
          const e0 = new Date(year, month, d, eh, em, 0, 0).getTime();

          for (let t = s0; t + data.durationMin * 60_000 <= e0; t += step * 60_000) {
            if (seen.has(t)) continue;
            seen.add(t);
            const slotEnd = t + data.durationMin * 60_000;
            const overlap = allBusy.some((b) => t < b.e && slotEnd > b.s);
            if (!overlap) total++;
          }
        }
      }

      months.push({ year, month, label, availableCount: total });
    }

    return { months };
  });

const daysInput = z.object({
  doctorId: z.string().uuid(),
  locationId: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(0).max(11),
  durationMin: z.number().int().min(5).max(240),
});

export const getAvailableDaysInMonth = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => daysInput.parse(data))
  .handler(async ({ data }) => {
    const { year, month } = data;
    const dk = demoKey(year, month);

    if (dk in DEMO_DAYS) {
      return { availableDays: DEMO_DAYS[dk] };
    }

    const sb = publicClient();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: avail } = await sb
      .from("availability")
      .select("*")
      .eq("doctor_id", data.doctorId)
      .eq("location_id", data.locationId);

    if (!avail || avail.length === 0) return { availableDays: [] as number[] };

    const now = new Date();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const { data: appts } = await supabaseAdmin
      .from("appointments")
      .select("scheduled_at, duration_min")
      .eq("doctor_id", data.doctorId)
      .gte("scheduled_at", monthStart.toISOString())
      .lte("scheduled_at", new Date(year, month, monthEnd.getDate(), 23, 59, 59).toISOString())
      .neq("status", "cancelled");

    const busy = (appts ?? []).map((a) => ({
      s: new Date(a.scheduled_at).getTime(),
      e: new Date(a.scheduled_at).getTime() + a.duration_min * 60_000,
    }));

    const weekdaysPresent = new Set(avail.map((a) => a.weekday));
    const availableDays: number[] = [];

    for (let d = 1; d <= monthEnd.getDate(); d++) {
      const day = new Date(year, month, d);
      if (day.getTime() <= now.getTime()) continue;
      const wd = day.getDay();
      if (!weekdaysPresent.has(wd)) continue;

      const blocks = avail.filter((a) => a.weekday === wd);
      let hasSlot = false;

      outer: for (const block of blocks) {
        const [sh, sm] = block.start_time.split(":").map(Number);
        const [eh, em] = block.end_time.split(":").map(Number);
        const step = block.slot_minutes;
        const s0 = new Date(year, month, d, sh, sm, 0, 0).getTime();
        const e0 = new Date(year, month, d, eh, em, 0, 0).getTime();

        for (let t = s0; t + data.durationMin * 60_000 <= e0; t += step * 60_000) {
          if (t <= now.getTime()) continue;
          const slotEnd = t + data.durationMin * 60_000;
          if (!busy.some((b) => t < b.e && slotEnd > b.s)) {
            hasSlot = true;
            break outer;
          }
        }
      }

      if (hasSlot) availableDays.push(d);
    }

    return { availableDays };
  });
