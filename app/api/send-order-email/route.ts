import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Envoi de l'email de confirmation de commande au client (via Resend).
// Clé secrète côté serveur uniquement : process.env.RESEND_API_KEY
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, nom, numero, total, totalLivraison, articles, paiement, ville, adresse } = body || {}

    if (!email) return NextResponse.json({ ok: false, error: 'no-email' })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ ok: false, error: 'no-config' })

    const from = process.env.RESEND_FROM || 'BatiShop Cameroun <onboarding@resend.dev>'
    const bcc = process.env.RESEND_BCC // optionnel : copie à BatiShop

    const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA'
    const rows = (articles || []).map((a: any) =>
      `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${a.nom} <span style="color:#888">× ${a.quantite} ${a.unite || ''}</span>${a.partenaire_nom ? `<br><span style="color:#aaa;font-size:12px">${a.partenaire_nom}</span>` : ''}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${fmt((a.prix || 0) * a.quantite)}</td>
      </tr>`
    ).join('')

    const paie = paiement === 'en_ligne' ? 'Paiement en ligne' : 'Paiement en magasin / à la réception'

    const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
      <div style="background:#1A2332;padding:20px 24px;border-radius:12px 12px 0 0">
        <span style="color:#fff;font-size:22px;font-weight:bold">Bati<span style="color:#C0392B">Shop</span> Cameroun</span>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <h2 style="margin:0 0 4px">Merci pour votre commande${nom ? ', ' + nom : ''} !</h2>
        <p style="color:#666;margin:0 0 16px">Voici le récapitulatif de votre commande <strong>${numero || ''}</strong>.</p>
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          ${totalLivraison ? `<tr><td style="padding:4px 0;color:#666">Livraison</td><td style="padding:4px 0;text-align:right">${fmt(totalLivraison)}</td></tr>` : ''}
          <tr><td style="padding:10px 0;font-size:18px;font-weight:bold">TOTAL</td><td style="padding:10px 0;text-align:right;font-size:18px;font-weight:bold;color:#C0392B">${fmt(total)}</td></tr>
        </table>
        <p style="color:#666;font-size:14px;margin:8px 0 0">Mode de paiement : ${paie}</p>
        ${ville ? `<p style="color:#666;font-size:14px;margin:4px 0 0">Ville : ${ville}${adresse && adresse !== '—' ? ' — ' + adresse : ''}</p>` : ''}
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:13px">
          Nous vous contacterons rapidement pour confirmer. Merci de votre confiance.<br>
          <a href="https://batishop-cameroun.com" style="color:#C0392B">batishop-cameroun.com</a>
        </div>
      </div>
    </div>`

    const payload: any = {
      from,
      to: [email],
      subject: `Votre commande ${numero || ''} — BatiShop Cameroun`,
      html,
    }
    if (bcc) payload.bcc = [bcc]

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)
    return NextResponse.json({ ok: res.ok, data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'exception' })
  }
}
