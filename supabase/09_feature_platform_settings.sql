-- ====================================================================
-- FEATURE: PLATFORM SETTINGS (09_feature_platform_settings.sql)
-- GVM EDULMS — Global Platform Configuration, Institutional Branding & Receipt Settings
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. PLATFORM GLOBAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    settings JSONB NOT NULL DEFAULT '{
        "platformName": "Gyan Vidya Mandir (GVM)",
        "logoUrl": "/gvm.png",
        "logoText": "GVM",
        "supportEmail": "support@gvmedu.com",
        "defaultLanguage": "en",
        "allowRegistration": true,
        "maintenanceMode": false,
        "teacherApprovalMode": "manual",
        "shortsMaxDuration": "60",
        "shortsCreatorPolicy": "teachers",
        "chatEngine": {
            "callingEnabled": true,
            "studentDMsEnabled": true,
            "groupCreationAllowed": true,
            "fileUploadsAllowed": true
        }
    }'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public."Profile"(id) ON DELETE SET NULL
);

INSERT INTO public.platform_settings (id) 
VALUES ('global') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Public write on platform_settings" ON public.platform_settings;
CREATE POLICY "Public read on platform_settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Public write on platform_settings" ON public.platform_settings FOR ALL USING (true);

-- 2. FEE RECEIPT INSTITUTIONAL HEADER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.fee_receipt_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    institute_name TEXT NOT NULL DEFAULT 'Gyan Vidya Mandir',
    department_name TEXT DEFAULT 'Department of Student Accounts & Finance',
    reference_prefix TEXT DEFAULT 'GVM-FEE-2026',
    address_line TEXT DEFAULT '124 Knowledge Boulevard, Institutional Area, Tech City - 560001',
    contact_email TEXT DEFAULT 'accounts@gvmedu.com',
    contact_phone TEXT DEFAULT '+91 98765 43210',
    logo_url TEXT DEFAULT '/gvm.png',
    authorized_signatory_title TEXT DEFAULT 'Accounts Comptroller / Authorized Registrar',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.fee_receipt_settings (id) 
VALUES ('default') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.fee_receipt_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_receipt_settings" ON public.fee_receipt_settings;
DROP POLICY IF EXISTS "Public write on fee_receipt_settings" ON public.fee_receipt_settings;
CREATE POLICY "Public read on fee_receipt_settings" ON public.fee_receipt_settings FOR SELECT USING (true);
CREATE POLICY "Public write on fee_receipt_settings" ON public.fee_receipt_settings FOR ALL USING (true);
