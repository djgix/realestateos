import { createClient } from '@supabase/supabase-js'

let _serviceClient: ReturnType<typeof createClient> | undefined

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _serviceClient
}
