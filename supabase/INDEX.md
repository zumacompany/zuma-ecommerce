# 📚 ZUMA DATABASE - DOCUMENTATION INDEX

**Last Updated:** 2026-02-10  
**Schema Version:** 2.0 (Production Ready)

---

## 🎯 Start Here

**New to the project?** Read in this order:

1. **[README.md](../README.md)** - Project overview & quick setup
2. **[SCHEMA_DOCUMENTATION.md](./SCHEMA_DOCUMENTATION.md)** - Complete database guide
3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Common queries & tasks

---

## 📁 File Structure

```
zuma/
├── README.md                           # Main project documentation
├── QA_FIXES_SUMMARY.md                 # QA implementation report
├── SCHEMA_UNIFICATION_SUMMARY.md       # Schema unification explained
├── supabase/
│   ├── MASTER_SCHEMA.sql              # ⭐ PRIMARY SCHEMA FILE
│   ├── SCHEMA_DOCUMENTATION.md         # Complete reference guide
│   ├── QUICK_REFERENCE.md              # Quick SQL reference
│   ├── INDEX.md                        # This file
│   ├── schema.sql                      # ⚠️ DEPRECATED - use MASTER_SCHEMA.sql
│   ├── merge_14JAN26.txt               # Historical live DB dump
│   └── migrations/
│       ├── 20240101000001_add_digital_inventory.sql
│       ├── 20240102000000_add_analytics_indexes.sql
│       └── 20240103000000_add_customer_fields.sql
```

---

## 📖 Documentation Guide

### 🌟 Primary Files (Use These!)

| File | Purpose | When to Use |
|------|---------|-------------|
| **`MASTER_SCHEMA.sql`** | ✅ **Master schema** | New deployments, resets, reference |
| **`SCHEMA_DOCUMENTATION.md`** | Complete guide | Understanding structure, migration |
| **`QUICK_REFERENCE.md`** | SQL quick reference | Daily development, troubleshooting |

### 📋 Summary Files

| File | Purpose |
|------|---------|
| **`SCHEMA_UNIFICATION_SUMMARY.md`** | Explains how schemas were unified |
| **`../QA_FIXES_SUMMARY.md`** | All QA fixes implemented |
| **`../README.md`** | Main project setup |

### ⚠️ Deprecated Files (Don't Use!)

| File | Status | What to Use Instead |
|------|--------|---------------------|
| `schema.sql` | ❌ Deprecated | Use `MASTER_SCHEMA.sql` |
| `merge_14JAN26.txt` | ❌ Historical | Use `MASTER_SCHEMA.sql` |

---

## 🎓 Learning Path

### Level 1: Getting Started

1. Read [`../README.md`](../README.md) - Section "Database Schema"
2. Run setup: `supabase db reset`
3. Verify: Check that all 25 tables exist

### Level 2: Understanding Structure

1. Read [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) - "Complete Table List"
2. Review schema relationships
3. Understand key functions

### Level 3: Daily Development

1. Bookmark [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)
2. Learn common queries
3. Understand maintenance tasks

### Level 4: Advanced Topics

1. Read [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) - "Migration Guide"
2. Understand trigger mechanics
3. Review performance optimization

---

## 🚀 Common Tasks

### I want to... → Go to...

| Task | File | Section |
|------|------|---------|
| Set up new database | [`README.md`](../README.md) | "Database Schema" |
| Understand table structure | [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) | "Complete Table List" |
| Run a common query | [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) | "Common Queries" |
| Migrate existing DB | [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) | "Migration Guide" |
| Troubleshoot issues | [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) | "Troubleshooting" |
| Check database health | [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) | "Health Check" |
| Understand QA fixes | [`../QA_FIXES_SUMMARY.md`](../QA_FIXES_SUMMARY.md) | Full document |
| Learn what changed | [`SCHEMA_UNIFICATION_SUMMARY.md`](../SCHEMA_UNIFICATION_SUMMARY.md) | "Before vs After" |

---

## 📊 Key Information

### Database Statistics

- **Total Tables:** 25
- **Functions:** 7
- **Triggers:** 10
- **Indexes:** 15+
- **Foreign Keys:** 20+

### Table Categories

| Category | Count | Tables |
|----------|-------|--------|
| Catalog | 5 | categories, regions, brands, products, offers |
| Orders | 5 | orders, order_items, order_status_history, order_deliveries, order_sequence |
| Content | 5 | home_content, home_featured_brands, trust_points, faqs, site_content |
| Customers | 2 | customers, customer_payment_profiles |
| Payments | 2 | payment_methods, stripe_events |
| Subscriptions | 2 | subscription_plans, subscriptions |
| Admin | 2 | admin_users, audit_logs |
| Inventory | 1 | digital_codes |
| Analytics | 1 | analytics_events |

---

## 🔍 Quick Search

### Find by Topic

**Authentication & Admin:**
- Table: `admin_users`
- See: [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md)

**Orders & Checkout:**
- Tables: `orders`, `order_items`, `order_status_history`
- Function: `create_order()`
- See: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - "Get Order with Items"

**Inventory Management:**
- Tables: `offers`, `digital_codes`
- Function: `sync_offer_stock()`
- See: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - "Check Stock Availability"

**Customer Management:**
- Table: `customers`
- Function: `upsert_customer_by_whatsapp()`
- See: [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) - "upsert_customer_by_whatsapp"

**Analytics:**
- Table: `analytics_events`
- Indexes: 3 performance indexes
- See: [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - "Analytics Dashboard"

**Content Management:**
- Tables: `home_content`, `trust_points`, `faqs`
- See: [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] All 25 tables created
- [ ] All 7+ functions created
- [ ] All 10+ triggers active
- [ ] All indexes created
- [ ] Foreign keys in place
- [ ] Seed data inserted
- [ ] `create_order()` works
- [ ] `upsert_customer_by_whatsapp()` works
- [ ] Stock validation works
- [ ] Status updates work

**Run:** See [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - "Health Check"

---

## 🆘 Need Help?

### Common Issues

| Issue | Solution |
|-------|----------|
| "Table already exists" | Normal if running multiple times (idempotent) |
| "Function already exists" | Drop and recreate from MASTER_SCHEMA.sql |
| "Constraint violation" | Check [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) - "Troubleshooting" |
| "Missing column" | Re-run MASTER_SCHEMA.sql or add manually |

### Debugging Steps

1. Check [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - "Troubleshooting"
2. Verify health: Run health check queries
3. Review logs: Check Supabase dashboard
4. Read docs: See relevant section in [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md)

---

## 📌 Version History

| Version | Date | Changes |
|---------|------|---------|
| **2.0** | 2026-02-10 | ✅ Unified master schema created |
| 1.5 | 2026-01-14 | Live DB snapshot (merge_14JAN26.txt) |
| 1.0 | 2025-12-27 | Initial schema.sql |

---

## 🔗 External Resources

### Supabase Documentation

- [Supabase Database](https://supabase.com/docs/guides/database)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/xfunc.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Tools

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [psql](https://www.postgresql.org/docs/current/app-psql.html)

---

## 📝 Change Log

### 2026-02-10 - Schema Unification

**Added:**
- `MASTER_SCHEMA.sql` - Unified master schema
- `SCHEMA_DOCUMENTATION.md` - Complete documentation
- `QUICK_REFERENCE.md` - SQL quick reference
- `INDEX.md` - This file

**Fixed:**
- Order status constraint (standardized to 'canceled')
- Added `city` and `birthdate` to customers
- Added performance indexes
- Stock validation with row locking

**Deprecated:**
- `schema.sql` - Replaced by MASTER_SCHEMA.sql

---

## 🎯 Summary

**You now have:**

✅ **One master schema file** (`MASTER_SCHEMA.sql`)  
✅ **Complete documentation** (3 detailed guides)  
✅ **Quick reference** for daily use  
✅ **Clear migration path**  
✅ **All QA fixes** implemented  
✅ **Production-ready** database

**Start with:** [`README.md`](../README.md) → Setup your database  
**Learn from:** [`SCHEMA_DOCUMENTATION.md`](./SCHEMA_DOCUMENTATION.md) → Understand the structure  
**Use daily:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) → Common tasks

---

**Happy coding! 🚀**

