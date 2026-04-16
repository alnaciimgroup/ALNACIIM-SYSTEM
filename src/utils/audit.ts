import { createClient } from './supabase/server'

export type AuditAction = 
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  | 'CREATE_SALE'
  | 'UPDATE_SALE'
  | 'DELETE_SALE'
  | 'CANCEL_SALE'
  | 'RECORD_PAYMENT'
  | 'SUBMIT_DAILY_REPORT'
  | 'SUBMIT_CASH'
  | 'VERIFY_SUBMISSION'
  | 'DISPUTE_SUBMISSION'
  | 'EDIT_SUBMISSION'
  | 'DISTRIBUTE_STOCK'
  | 'UPDATE_DISTRIBUTION'
  | 'DELETE_DISTRIBUTION'
  | 'CREATE_USER'
  | 'DELETE_USER'
  | 'LOGIN'
  | 'LOGOUT';

export async function logAction(
  action: AuditAction,
  metadata: {
    targetTable?: string;
    targetId?: string;
    details?: any;
  } = {}
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // Don't log if no user (unless it's a login attempt, handled separately)

  const role = user.user_metadata?.role || user.app_metadata?.role || 'staff'

  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user.id,
      user_role: role,
      action_type: action,
      target_table: metadata.targetTable,
      target_id: metadata.targetId,
      metadata: metadata.details
    })

  if (error) {
    console.error('Failed to log action:', error)
  }
}
