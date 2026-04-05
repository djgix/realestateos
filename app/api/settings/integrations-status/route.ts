import { NextResponse } from 'next/server'
import { getIntegrationStatuses } from '@/lib/integrations-status'

export async function GET() {
  return NextResponse.json({
    integrations: getIntegrationStatuses(),
  })
}
