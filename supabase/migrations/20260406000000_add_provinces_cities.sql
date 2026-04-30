-- Adds provinces + cities tables and seeds them with the Mozambique dataset that
-- was previously hardcoded in components/CheckoutClient.tsx (MOZ_DATA).
-- A follow-up migration can attach country_code once multi-country is enabled.

CREATE TABLE IF NOT EXISTS public.provinces (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  region_code text NOT NULL DEFAULT 'MZ',
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT provinces_pkey PRIMARY KEY (id),
  CONSTRAINT provinces_region_name_key UNIQUE (region_code, name)
);

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  province_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cities_pkey PRIMARY KEY (id),
  CONSTRAINT cities_province_fk FOREIGN KEY (province_id)
    REFERENCES public.provinces(id) ON DELETE CASCADE,
  CONSTRAINT cities_province_name_key UNIQUE (province_id, name)
);

CREATE INDEX IF NOT EXISTS cities_province_id_idx ON public.cities(province_id);

-- Read-only access for the public role; writes go through service role.
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provinces_public_read ON public.provinces;
CREATE POLICY provinces_public_read ON public.provinces FOR SELECT USING (true);

DROP POLICY IF EXISTS cities_public_read ON public.cities;
CREATE POLICY cities_public_read ON public.cities FOR SELECT USING (true);

-- Seed Mozambique provinces + cities
DO $$
DECLARE
  v_province_id uuid;
BEGIN
  INSERT INTO public.provinces (region_code, name) VALUES
    ('MZ', 'Cabo Delgado'),
    ('MZ', 'Gaza'),
    ('MZ', 'Inhambane'),
    ('MZ', 'Manica'),
    ('MZ', 'Cidade de Maputo'),
    ('MZ', 'Maputo Província'),
    ('MZ', 'Nampula'),
    ('MZ', 'Niassa'),
    ('MZ', 'Sofala'),
    ('MZ', 'Tete'),
    ('MZ', 'Zambézia')
  ON CONFLICT (region_code, name) DO NOTHING;

  -- Cabo Delgado
  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Cabo Delgado';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Balama'), (v_province_id, 'Chiúre'), (v_province_id, 'Ibo'),
    (v_province_id, 'Mocímboa da Praia'), (v_province_id, 'Montepuez'),
    (v_province_id, 'Mueda'), (v_province_id, 'Pemba')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Gaza';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Chibuto'), (v_province_id, 'Chócue'), (v_province_id, 'Macia'),
    (v_province_id, 'Manjacaze'), (v_province_id, 'Massingir'),
    (v_province_id, 'Praia do Bilene (Bilene)'), (v_province_id, 'Xai-Xai')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Inhambane';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Homoíne'), (v_province_id, 'Inhambane'), (v_province_id, 'Massinga'),
    (v_province_id, 'Maxixe'), (v_province_id, 'Quissico'), (v_province_id, 'Vilanculos')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Manica';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Catandica'), (v_province_id, 'Chimoio'), (v_province_id, 'Gondola'),
    (v_province_id, 'Guro'), (v_province_id, 'Manica'), (v_province_id, 'Sussundenga')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Cidade de Maputo';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Distrito Urbano de KaMpfumo'),
    (v_province_id, 'Distrito Urbano de Nlhamankulu'),
    (v_province_id, 'Distrito Urbano de KaMaxaquene'),
    (v_province_id, 'Distrito Urbano de KaMavota'),
    (v_province_id, 'Distrito Urbano de KaMubukwana'),
    (v_province_id, 'Distrito Municipal de KaTembe'),
    (v_province_id, 'Distrito Municipal de KaNyaka')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Maputo Província';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Boane'), (v_province_id, 'Manhiça'), (v_province_id, 'Marracuene'),
    (v_province_id, 'Matola'), (v_province_id, 'Matola-Rio'), (v_province_id, 'Namaacha')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Nampula';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Angoche'), (v_province_id, 'Ilha de Moçambique'),
    (v_province_id, 'Malema'), (v_province_id, 'Monapo'), (v_province_id, 'Mossuril'),
    (v_province_id, 'Nacala Porto'), (v_province_id, 'Nampula'), (v_province_id, 'Ribaué')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Niassa';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Cuamba'), (v_province_id, 'Insaca'), (v_province_id, 'Lichinga'),
    (v_province_id, 'Mandimba'), (v_province_id, 'Marrupa'), (v_province_id, 'Metangula')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Sofala';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Beira'), (v_province_id, 'Caia'), (v_province_id, 'Dondo'),
    (v_province_id, 'Gorongosa'), (v_province_id, 'Marromeu'), (v_province_id, 'Nhamatanda')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Tete';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Chitima'), (v_province_id, 'Moatize'), (v_province_id, 'Nhamayabué'),
    (v_province_id, 'Tete'), (v_province_id, 'Ulongué')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_province_id FROM public.provinces WHERE region_code='MZ' AND name='Zambézia';
  INSERT INTO public.cities (province_id, name) VALUES
    (v_province_id, 'Alto Molócue'), (v_province_id, 'Gurué'),
    (v_province_id, 'Maganja da Costa'), (v_province_id, 'Milange'),
    (v_province_id, 'Mocuba'), (v_province_id, 'Morrumbala'), (v_province_id, 'Quelimane')
  ON CONFLICT DO NOTHING;
END $$;
