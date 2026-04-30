import 'server-only'
import { createSupabaseAdminClient, getSessionUser } from '@/src/server/platform/db/supabase'

export type AuditEntry = {
    action: string         // e.g. 'order.update_status'
    resource_type: string  // e.g. 'order'
    resource_id?: string | null
    diff?: Record<string, any> | null
}

// Resolve the currently authenticated admin user from request cookies. We can't
// rely on a passed-in user object because admin route handlers historically
// weren't given one — middleware only gates access. Returns null if no user.
async function resolveAdminUser() {
    try {
        return await getSessionUser()
    } catch {
        return null
    }
}

// Fire-and-forget audit write. Never throws — auditing must not break the
// underlying mutation. Pass the originating Request when available so we can
// capture IP + user agent.
export async function recordAdminAction(entry: AuditEntry, req?: Request): Promise<void> {
    try {
        const supabaseAdmin = createSupabaseAdminClient()
        const user = await resolveAdminUser()
        const headers = req?.headers
        const ip = headers?.get('x-forwarded-for')?.split(',')[0]?.trim()
            || headers?.get('x-real-ip')
            || null
        const ua = headers?.get('user-agent') || null

        await supabaseAdmin.from('admin_audit_log').insert({
            admin_user_id: user?.id ?? null,
            admin_email: user?.email ?? null,
            action: entry.action,
            resource_type: entry.resource_type,
            resource_id: entry.resource_id ?? null,
            diff: entry.diff ?? null,
            ip_address: ip,
            user_agent: ua,
        })
    } catch (err) {
        // Never surface — auditing failures must never block the main mutation.
        console.error('[audit] failed to record action', entry.action, err)
    }
}
