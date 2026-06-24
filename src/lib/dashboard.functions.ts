import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWaitlist = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("waitlist")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

// Get the doctor record for the currently logged-in user
export const getMyDoctor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("doctors")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });

// Get today's appointments for a doctor
export const getTodayAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().split("T")[0];
    const dayStart = today + "T00:00:00.000Z";
    const dayEnd = today + "T23:59:59.999Z";

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*, services(name, duration_min), locations(name, city, address), doctors(full_name, title)")
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .not("status", "eq", "cancelled")
      .order("scheduled_at");

    if (error) throw new Error(error.message);
    return data ?? [];
  });

const startInput = z.object({ appointmentId: z.string().uuid() });

export const startAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", data.appointmentId)
      .eq("status", "scheduled");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const completeInput = z.object({ appointmentId: z.string().uuid() });

export const completeAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => completeInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.appointmentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const delayInput = z.object({ doctorId: z.string().uuid() });

// Returns appointments running late + next affected appointments
export const getDelayedAppointments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => delayInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().split("T")[0];

    const { data: inProgress } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("doctor_id", data.doctorId)
      .eq("status", "in_progress");

    const delays: Array<{ appointmentId: string; delayMinutes: number }> = [];
    for (const apt of inProgress ?? []) {
      if (!apt.started_at) continue;
      const elapsed = (Date.now() - new Date(apt.started_at).getTime()) / 60_000;
      const delayMin = Math.max(0, elapsed - apt.duration_min);
      if (delayMin > 5) {
        delays.push({ appointmentId: apt.id, delayMinutes: Math.ceil(delayMin) });

        // Find next scheduled appointments today for this doctor
        const { data: next } = await supabaseAdmin
          .from("appointments")
          .select("id, patient_phone, patient_name, scheduled_at")
          .eq("doctor_id", data.doctorId)
          .eq("status", "scheduled")
          .gte("scheduled_at", today + "T00:00:00.000Z")
          .lte("scheduled_at", today + "T23:59:59.999Z")
          .gt("scheduled_at", apt.scheduled_at)
          .order("scheduled_at")
          .limit(5);

        for (const n of next ?? []) {
          // Log delay notification (pending — SMS sender reads from notifications table)
          await supabaseAdmin.from("notifications").upsert(
            {
              appointment_id: n.id,
              type: "delay",
              channel: "sms",
              to_phone: n.patient_phone,
              message: `Informujemy, że wizyta opóźni się o około ${Math.ceil(delayMin)} min. Przepraszamy za niedogodności.`,
              status: "pending",
              scheduled_for: new Date().toISOString(),
            },
            { onConflict: "appointment_id,type", ignoreDuplicates: true },
          );
        }
      }
    }
    return { delays };
  });
