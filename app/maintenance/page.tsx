import { PAYS, SITE } from '../../lib/config'

export const metadata = {
  title: 'Bientôt de retour — BatiShop',
  robots: { index: false, follow: false },
}

export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-acier px-6 text-center">
      <div className="max-w-md">
        <div className="font-condensed font-bold text-3xl text-white mb-6">
          Bati<span className="text-brique">Shop</span> {PAYS.code}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-5xl mb-4">🛠️</div>
          <h1 className="font-condensed font-bold text-2xl text-white mb-3">
            Site en maintenance
          </h1>
          <p className="text-white/70 leading-relaxed mb-6">
            Nous améliorons la plateforme en ce moment. BatiShop {PAYS.nom} sera de
            retour très bientôt. Merci de votre patience !
          </p>

          {SITE?.tel && (
            <p className="text-sm text-white/60">
              Une question ? Contactez-nous au{' '}
              <span className="text-or font-semibold">{SITE.tel}</span>
            </p>
          )}
        </div>

        <p className="text-xs text-white/30 mt-6">
          © {new Date().getFullYear()} BatiShop {PAYS.code}
        </p>
      </div>
    </div>
  )
}
