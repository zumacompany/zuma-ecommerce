-- ============================================================
-- Phase 8 — show out-of-stock offers instead of hiding them
-- ============================================================
-- Adds a per-offer toggle that controls whether a non-unlimited
-- offer at zero stock should still render on the storefront with
-- a disabled CTA. Default `true` keeps every existing offer
-- visible after this migration; merchants can opt-in to the legacy
-- "disappear when sold out" behaviour by setting it to `false`.
--
-- Roadmap: .updates/fix-roadmap.md, Phase 8.
-- ============================================================

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS show_when_out_of_stock boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.offers.show_when_out_of_stock IS
  'When TRUE, the offer is still listed on the storefront when stock_quantity = 0 (with a disabled "Out of stock" CTA). When FALSE, the offer is hidden from the public catalog while sold out. Ignored for is_unlimited = TRUE offers.';

DO $$
BEGIN
  RAISE NOTICE '✅ Added offers.show_when_out_of_stock (default true)';
END$$;
