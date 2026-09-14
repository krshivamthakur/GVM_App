-- ====================================================================
-- FEATURE: FEE MANAGEMENT (05_feature_fee_management.sql)
-- GVM EDULMS — Fee Structures, Categories, Discounts, Student Profiles,
-- Installments, Payment Receipts & Institutional Receipt Configuration
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. FEE CATEGORIES TABLE (Itemized fee line items)
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    is_refundable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_categories_code ON public.fee_categories(code);

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_categories" ON public.fee_categories;
DROP POLICY IF EXISTS "Public write on fee_categories" ON public.fee_categories;
CREATE POLICY "Public read on fee_categories" ON public.fee_categories FOR SELECT USING (true);
CREATE POLICY "Public write on fee_categories" ON public.fee_categories FOR ALL USING (true);

-- 2. FEE STRUCTURES TABLE (Master course & batch fee templates)
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    batch_year VARCHAR(20) NOT NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'semester' CHECK (frequency IN ('annual', 'semester', 'quarterly', 'monthly', 'one_time')),
    total_amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    grace_period_days INTEGER DEFAULT 7,
    late_fine_per_day NUMERIC(10, 2) DEFAULT 50.00,
    max_late_fine NUMERIC(10, 2) DEFAULT 1500.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_course_id ON public.fee_structures(course_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_is_active ON public.fee_structures(is_active);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_structures" ON public.fee_structures;
DROP POLICY IF EXISTS "Public write on fee_structures" ON public.fee_structures;
CREATE POLICY "Public read on fee_structures" ON public.fee_structures FOR SELECT USING (true);
CREATE POLICY "Public write on fee_structures" ON public.fee_structures FOR ALL USING (true);

-- 3. FEE STRUCTURE ITEMS TABLE (Relational line items for breakdown)
CREATE TABLE IF NOT EXISTS public.fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    is_optional BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_fee_structure_items_structure ON public.fee_structure_items(structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_structure_items_category ON public.fee_structure_items(category_id);

ALTER TABLE public.fee_structure_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_structure_items" ON public.fee_structure_items;
DROP POLICY IF EXISTS "Public write on fee_structure_items" ON public.fee_structure_items;
CREATE POLICY "Public read on fee_structure_items" ON public.fee_structure_items FOR SELECT USING (true);
CREATE POLICY "Public write on fee_structure_items" ON public.fee_structure_items FOR ALL USING (true);

-- 4. FEE DISCOUNTS & SCHOLARSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.fee_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    value NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fee_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_discounts" ON public.fee_discounts;
DROP POLICY IF EXISTS "Public write on fee_discounts" ON public.fee_discounts;
CREATE POLICY "Public read on fee_discounts" ON public.fee_discounts FOR SELECT USING (true);
CREATE POLICY "Public write on fee_discounts" ON public.fee_discounts FOR ALL USING (true);

-- 5. STUDENT FEE PROFILES TABLE (Individual student fee dues & balances)
CREATE TABLE IF NOT EXISTS public.student_fee_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE,
    structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    discount_id UUID REFERENCES public.fee_discounts(id) ON DELETE SET NULL,
    custom_adjustment NUMERIC(12, 2) DEFAULT 0.00,
    net_fee NUMERIC(12, 2) NOT NULL,
    paid_fee NUMERIC(12, 2) DEFAULT 0.00,
    due_fee NUMERIC(12, 2) NOT NULL,
    late_fine_accrued NUMERIC(10, 2) DEFAULT 0.00,
    last_payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_fee_profiles_student ON public.student_fee_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_profiles_status ON public.student_fee_profiles(status);

ALTER TABLE public.student_fee_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on student_fee_profiles" ON public.student_fee_profiles;
DROP POLICY IF EXISTS "Public write on student_fee_profiles" ON public.student_fee_profiles;
CREATE POLICY "Public read on student_fee_profiles" ON public.student_fee_profiles FOR SELECT USING (true);
CREATE POLICY "Public write on student_fee_profiles" ON public.student_fee_profiles FOR ALL USING (true);

-- 6. FEE INSTALLMENTS TABLE (Scheduled student payment milestones)
CREATE TABLE IF NOT EXISTS public.fee_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    installment_number INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    late_fine NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid', 'overdue')),
    paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fee_installments_student ON public.fee_installments(student_id);

ALTER TABLE public.fee_installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_installments" ON public.fee_installments;
DROP POLICY IF EXISTS "Public write on fee_installments" ON public.fee_installments;
CREATE POLICY "Public read on fee_installments" ON public.fee_installments FOR SELECT USING (true);
CREATE POLICY "Public write on fee_installments" ON public.fee_installments FOR ALL USING (true);

-- 7. FEE PAYMENTS TABLE (Official payments & receipts ledger)
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL,
    installment_id UUID,
    amount_paid NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card', 'cheque')),
    transaction_ref VARCHAR(100),
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    received_by VARCHAR(100) DEFAULT 'Admin Accounts',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'pending', 'refunded', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt ON public.fee_payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON public.fee_payments(student_id);

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read on fee_payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Public write on fee_payments" ON public.fee_payments;
CREATE POLICY "Public read on fee_payments" ON public.fee_payments FOR SELECT USING (true);
CREATE POLICY "Public write on fee_payments" ON public.fee_payments FOR ALL USING (true);

-- 8. FEE RECEIPT SETTINGS TABLE (Printable institutional receipt configuration)
CREATE TABLE IF NOT EXISTS public.fee_receipt_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    institute_name TEXT NOT NULL DEFAULT 'GVM Educational Institute',
    department_name TEXT DEFAULT 'Department of Student Accounts & Finance',
    reference_prefix TEXT DEFAULT 'GVM-FEE-2026',
    address_line TEXT DEFAULT '124 Knowledge Boulevard, Institutional Area, Tech City - 560001',
    contact_email TEXT DEFAULT 'accounts@gvmedu.com',
    contact_phone TEXT DEFAULT '+91 98765 43210',
    logo_url TEXT,
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

-- 9. BASELINE SEED DATA (Categories & Standard Scholarships)
INSERT INTO public.fee_categories (name, code, description, is_refundable) VALUES
    ('Tuition Fee', 'TUI', 'Core instructional and classroom tuition', false),
    ('Admission Fee', 'ADM', 'One-time enrollment and registration fee', false),
    ('Laboratory Fee', 'LAB', 'Practical lab equipment and consumables fee', false),
    ('Library Fee', 'LIB', 'Library resource access and digital subscriptions', false),
    ('Examination Fee', 'EXAM', 'Semester and annual examination fees', false),
    ('Development Fee', 'DEV', 'Campus infrastructure and development fund', false),
    ('General Fee', 'GEN', 'General miscellaneous institutional fees', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.fee_discounts (name, discount_type, value, description, is_active) VALUES
    ('Merit Scholarship', 'percentage', 20.00, 'Academic excellence scholarship', true),
    ('Sibling Concession', 'percentage', 10.00, 'Discount for enrolled siblings', true),
    ('Sports Excellence', 'percentage', 15.00, 'State / National sports quota concession', true)
ON CONFLICT DO NOTHING;
