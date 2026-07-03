import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// Empêche toute mise en cache : la requête s'exécute vraiment à chaque appel.
export const dynamic = 'force-dynamic'

// Petite requête pour garder le projet Supabase actif et éviter sa mise en
// pause après 7 jours d'inactivité (plan gratuit). À appeler régulièrement
// via le cron Vercel (vercel.json) ou un service externe (UptimeRobot, cron-job.org).
export async function GET() {
  try {
    const { error } = await supabase
      .from('commission_config')
      .select('taux')
      .eq('id', 1)
      .maybeSingle()

    return NextResponse.json({
      ok: !error,
      service: 'supabase',
      at: new Date().toISOString(),
      error: error?.message || null,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, at: new Date().toISOString(), error: e?.message || 'unknown' }, { status: 500 })
  }
}
