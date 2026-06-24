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

export const getClinicData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [doctors, locations, services, testimonials, faqs, settings, doctorLocations] = await Promise.all([
    sb.from("doctors").select("*").eq("active", true).order("sort_order"),
    sb.from("locations").select("*").order("sort_order"),
    sb.from("services").select("*").eq("active", true).order("sort_order"),
    sb.from("testimonials").select("*").eq("published", true).order("sort_order"),
    sb.from("faqs").select("*").eq("published", true).order("sort_order"),
    sb.from("clinic_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("doctor_locations").select("*"),
  ]);
  return {
    doctors: doctors.data ?? [],
    locations: locations.data ?? [],
    services: services.data ?? [],
    testimonials: testimonials.data ?? [],
    faqs: faqs.data ?? [],
    settings: settings.data ?? null,
    doctorLocations: doctorLocations.data ?? [],
  };
});

// Compute available slots for a doctor at a location on a given date (YYYY-MM-DD).
const slotsInput = z.object({
  doctorId: z.string().uuid(),
  locationId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMin: z.number().int().min(5).max(240),
});

export const getAvailableSlots = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slotsInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Cannot select appointments anonymously due to RLS - use admin briefly inside handler
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const date = new Date(data.date + "T00:00:00");
    const weekday = date.getDay(); // 0..6 Sun..Sat

    const { data: avail } = await sb
      .from("availability")
      .select("*")
      .eq("doctor_id", data.doctorId)
      .eq("location_id", data.locationId)
      .eq("weekday", weekday);

    if (!avail || avail.length === 0) return { slots: [] as string[] };

    const dayStart = new Date(data.date + "T00:00:00");
    const dayEnd = new Date(data.date + "T23:59:59");
    const { data: appts } = await supabaseAdmin
      .from("appointments")
      .select("scheduled_at,duration_min,status")
      .eq("doctor_id", data.doctorId)
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString())
      .neq("status", "cancelled");

    const busy = (appts ?? []).map((a) => ({
      start: new Date(a.scheduled_at).getTime(),
      end: new Date(a.scheduled_at).getTime() + a.duration_min * 60_000,
    }));

    const now = Date.now();
    const slots: string[] = [];
    for (const block of avail) {
      const [sh, sm] = block.start_time.split(":").map(Number);
      const [eh, em] = block.end_time.split(":").map(Number);
      const step = block.slot_minutes;
      const start = new Date(date);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(date);
      end.setHours(eh, em, 0, 0);
      for (let t = start.getTime(); t + data.durationMin * 60_000 <= end.getTime(); t += step * 60_000) {
        if (t < now) continue;
        const slotEnd = t + data.durationMin * 60_000;
        const overlap = busy.some((b) => t < b.end && slotEnd > b.start);
        if (!overlap) slots.push(new Date(t).toISOString());
      }
    }
    return { slots };
  });

// Next available slot for a doctor (and optional location) — used in cards and hero.
const nextInput = z.object({
  doctorId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  durationMin: z.number().int().min(5).max(240).default(30),
  daysAhead: z.number().int().min(1).max(60).default(21),
});

export const getNextAvailable = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => nextInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let availQ = sb.from("availability").select("*");
    if (data.doctorId) availQ = availQ.eq("doctor_id", data.doctorId);
    if (data.locationId) availQ = availQ.eq("location_id", data.locationId);
    const { data: avail } = await availQ;
    if (!avail || avail.length === 0) return { next: null as string | null };

    const now = new Date();
    for (let d = 0; d < data.daysAhead; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      day.setHours(0, 0, 0, 0);
      const wd = day.getDay();
      const blocks = avail.filter((a) => a.weekday === wd);
      if (blocks.length === 0) continue;

      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      let apptQ = supabaseAdmin
        .from("appointments")
        .select("scheduled_at,duration_min,status,doctor_id")
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .neq("status", "cancelled");
      if (data.doctorId) apptQ = apptQ.eq("doctor_id", data.doctorId);
      const { data: appts } = await apptQ;
      const busy = (appts ?? []).map((a) => ({
        start: new Date(a.scheduled_at).getTime(),
        end: new Date(a.scheduled_at).getTime() + a.duration_min * 60_000,
      }));

      for (const block of blocks) {
        const [sh, sm] = block.start_time.split(":").map(Number);
        const [eh, em] = block.end_time.split(":").map(Number);
        const step = block.slot_minutes;
        const start = new Date(day);
        start.setHours(sh, sm, 0, 0);
        const end = new Date(day);
        end.setHours(eh, em, 0, 0);
        for (let t = start.getTime(); t + data.durationMin * 60_000 <= end.getTime(); t += step * 60_000) {
          if (t < now.getTime() + 30 * 60_000) continue; // at least 30 min lead time
          const slotEnd = t + data.durationMin * 60_000;
          const overlap = busy.some((b) => t < b.end && slotEnd > b.start);
          if (!overlap) return { next: new Date(t).toISOString() };
        }
      }
    }
    return { next: null };
  });

const createAppointmentInput = z.object({
  doctorId: z.string().uuid(),
  locationId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledAt: z.string(),
  patientName: z.string().trim().min(2).max(120),
  patientPhone: z.string().trim().min(6).max(20),
  patientEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
});

export const createAppointment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createAppointmentInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: svc, error: svcErr } = await sb
      .from("services")
      .select("duration_min")
      .eq("id", data.serviceId)
      .maybeSingle();
    if (svcErr || !svc) throw new Error("Nieprawidłowa usługa");

    const { data: appt, error } = await sb
      .from("appointments")
      .insert({
        doctor_id: data.doctorId,
        location_id: data.locationId,
        service_id: data.serviceId,
        scheduled_at: data.scheduledAt,
        duration_min: svc.duration_min,
        patient_name: data.patientName,
        patient_phone: data.patientPhone,
        patient_email: data.patientEmail || null,
        status: "scheduled",
      })
      .select("id, scheduled_at")
      .single();
    if (error) throw new Error(error.message);

    // Schedule notifications (stored as pending; provider integration is abstracted)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startMs = new Date(appt.scheduled_at).getTime();
    const events: Array<{ type: "confirmation" | "reminder_48h" | "reminder_24h" | "reminder_2h"; at: number; msg: string }> = [
      { type: "confirmation", at: Date.now(), msg: `Twoja wizyta została zarezerwowana.` },
      { type: "reminder_48h", at: startMs - 48 * 3600_000, msg: `Przypomnienie: Twoja wizyta odbędzie się za 48 godzin.` },
      { type: "reminder_24h", at: startMs - 24 * 3600_000, msg: `Przypomnienie: Twoja wizyta odbędzie się jutro.` },
      { type: "reminder_2h", at: startMs - 2 * 3600_000, msg: `Twoja wizyta odbędzie się za 2 godziny.` },
    ];
    await supabaseAdmin.from("notifications").insert(
      events
        .filter((e) => e.at > Date.now() - 60_000)
        .map((e) => ({
          appointment_id: appt.id,
          type: e.type,
          channel: "sms",
          to_phone: data.patientPhone,
          message: e.msg,
          status: "pending" as const,
          scheduled_for: new Date(e.at).toISOString(),
        })),
    );

    return { id: appt.id };
  });

const waitlistInput = z.object({
  doctorId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  patientName: z.string().trim().min(2).max(120),
  patientPhone: z.string().trim().min(6).max(20),
  preferredFrom: z.string().optional(),
  preferredTo: z.string().optional(),
});

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => waitlistInput.parse(data))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("waitlist").insert({
      doctor_id: data.doctorId ?? null,
      location_id: data.locationId ?? null,
      service_id: data.serviceId ?? null,
      patient_name: data.patientName,
      patient_phone: data.patientPhone,
      preferred_from: data.preferredFrom ?? null,
      preferred_to: data.preferredTo ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
