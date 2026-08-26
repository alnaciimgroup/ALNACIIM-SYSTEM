# ALNACIIM ERP & Water Distribution System

## Overview
This is the internal, proprietary Enterprise Resource Planning (ERP) and Sales Management system for ALNACIIM. It handles real-time sales tracking, logistics, inventory management, production tracking, and financial accounting.

**Notice:** This repository and its contents are strictly confidential and the exclusive property of ALNACIIM. Unauthorized access, copying, or distribution is strictly prohibited.

## System Architecture
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL), Row Level Security (RLS)
- **Deployment:** Vercel

## Role-Based Access Control (RBAC)
The system is protected by strict middleware routing and database-level RLS. Access is divided into five distinct operational roles:
1. **Manager:** Full access to all dashboards, analytics, and settings.
2. **Accountant:** Access to financial ledgers, billing, and order approvals.
3. **Agent:** Factory-based sales, distribution, and logistics routing.
4. **Staff (Drivers):** Mobile-optimized route delivery and field sales.
5. **Production:** Factory capacity, batches, and quality control.

## Security
- **Database:** Locked down via Row Level Security (RLS). Anonymous read/write access is blocked.
- **Authentication:** Supabase Auth with encrypted sessions.
- **API Keys:** Do not expose the `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

---
*© 2026 ALNACIIM Group. All rights reserved.*
