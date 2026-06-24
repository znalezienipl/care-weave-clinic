
-- Restrict has_role execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- Tighten anonymous insert policies with sane field constraints (replace WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can book" ON public.appointments;
CREATE POLICY "Anyone can book" ON public.appointments FOR INSERT TO anon, authenticated
WITH CHECK (
  length(patient_name) BETWEEN 2 AND 120
  AND length(patient_phone) BETWEEN 6 AND 20
  AND scheduled_at > now()
  AND status = 'scheduled'
);

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated
WITH CHECK (
  length(patient_name) BETWEEN 2 AND 120
  AND length(patient_phone) BETWEEN 6 AND 20
);

-- Tighten doctor update policy WITH CHECK
DROP POLICY IF EXISTS "Doctors update own appts" ON public.appointments;
CREATE POLICY "Doctors update own appts" ON public.appointments FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = appointments.doctor_id AND d.user_id = auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = appointments.doctor_id AND d.user_id = auth.uid())
);
