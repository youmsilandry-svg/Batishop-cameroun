import { NextResponse } from 'next/server'
import { SITE } from '../../../lib/config'

export const dynamic = 'force-dynamic'

// Envoie 2 emails (via Resend) à la réception d'une candidature partenaire :
//  - notification à BatiShop
//  - confirmation au candidat
// Clé secrète côté serveur uniquement : process.env.RESEND_API_KEY
export async function POST(req: Request) {
  try {
    const b = await req.json()
    const { nom, email, telephone, ville, quartier, type, metier, message } = b || {}

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ ok: false, error: 'no-config' })

    const from = process.env.RESEND_FROM || 'BatiShop Cameroun <onboarding@resend.dev>'
    const adminTo = process.env.RESEND_PARTENAIRES_TO || SITE.emailPartenaires || SITE.email

    const ligne = (label: string, val?: string) =>
      val ? `<tr><td style="padding:4px 12px 4px 0;color:#888">${label}</td><td style="padding:4px 0;font-weight:600">${val}</td></tr>` : ''

    const entete = `
      <div style="background:#1A2332;padding:18px 24px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-size:20px;font-weight:bold">Bati<span style="color:#C0392B">Shop</span> Cameroun</span>
      </div>`

    const send = (to: string, subject: string, html: string) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, html }),
      }).then(r => r.ok).catch(() => false)

    // 1) Notification à BatiShop
    const htmlAdmin = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
      ${entete}
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <h2 style="margin:0 0 12px">Nouvelle candidature partenaire</h2>
        <table style="border-collapse:collapse;font-size:14px">
          ${ligne('Type', type === 'professionnel' ? 'Professionnel' : 'Quincaillerie')}
          ${ligne('Nom', nom)}
          ${ligne('Téléphone', telephone)}
          ${ligne('Email', email)}
          ${ligne('Ville', ville)}
          ${ligne('Quartier', quartier)}
          ${ligne('Métier', metier)}
          ${ligne('Message', message)}
        </table>
        <p style="color:#999;font-size:13px;margin-top:16px">Candidature enregistrée avec le statut « en attente » dans l'espace admin.</p>
      </div>
    </div>`

    // 2) Confirmation au candidat
    const htmlClient = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
      ${entete}
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <h2 style="margin:0 0 4px">Merci${nom ? ', ' + nom : ''} !</h2>
        <p style="color:#666;margin:0 0 16px">
          Nous avons bien reçu votre candidature pour devenir <strong>partenaire BatiShop Cameroun</strong>.
          Notre équipe l'étudie et vous recontactera au numéro indiqué pour activer votre espace partenaire.
        </p>
        <table style="border-collapse:collapse;font-size:14px">
          ${ligne('Magasin / Nom', nom)}
          ${ligne('Ville', ville)}
          ${ligne('Téléphone', telephone)}
        </table>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:13px">
          À très bientôt sur <a href="https://batishop-cameroun.com" style="color:#C0392B">batishop-cameroun.com</a>
        </div>
      </div>
    </div>`

    const results = await Promise.all([
      adminTo ? send(adminTo, `Nouvelle candidature partenaire — ${nom || ''}`, htmlAdmin) : Promise.resolve(false),
      email ? send(email, 'Votre candidature partenaire — BatiShop Cameroun', htmlClient) : Promise.resolve(false),
    ])

    return NextResponse.json({ ok: true, admin: results[0], client: results[1] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'exception' })
  }
}
