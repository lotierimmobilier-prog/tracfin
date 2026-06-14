import { useState } from 'react';
import { Shield, FileCheck, AlertTriangle, TrendingUp, CheckCircle, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Landing() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-neutral-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-stone-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neutral-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-6 mb-6 animate-fade-in">
            <img
              src="/Logo-lotier.png"
              alt="Lotier"
              className="h-16 md:h-20 object-contain"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-amber-700 via-stone-700 to-amber-700 bg-clip-text text-transparent mb-2 animate-fade-in">
            TRACFIN LCB-FT
          </h1>
          <p className="text-sm md:text-base text-stone-600 font-medium mb-4 animate-fade-in-delay">
            by Lotier
          </p>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto animate-fade-in-delay mb-8">
            Plateforme INTERNE de l'agence LOTIER
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 border-4 border-amber-800 rounded-2xl p-8 shadow-2xl animate-fade-in-delay">
            <div className="flex items-start gap-4">
              <div className="bg-white rounded-full p-3 flex-shrink-0 shadow-lg">
                <Lock className="w-8 h-8 text-amber-700" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
                  Accès Réservé
                </h3>
                <div className="bg-white/95 rounded-xl p-5 mb-4 shadow-inner">
                  <p className="text-base text-amber-900 font-bold leading-relaxed mb-2">
                    Plateforme Interne LOTIER
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                    Cette application est exclusivement réservée aux <span className="font-bold text-amber-900">commerciaux et collaborateurs de l'agence immobilière LOTIER</span>.
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Cet outil n'est pas un site officiel du ministère de l'Économie ou de TRACFIN.
                  </p>
                </div>
                <div className="bg-amber-900/30 backdrop-blur-sm rounded-lg p-4 border border-amber-400/30">
                  <p className="text-sm text-white/95 leading-relaxed mb-2">
                    Pour toute information officielle sur TRACFIN :
                  </p>
                  <a
                    href="https://www.economie.gouv.fr/tracfin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-amber-100 underline transition"
                  >
                    www.economie.gouv.fr/tracfin
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-stone-200/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg p-2">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Connexion
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent transition pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6 mb-8 max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-stone-200/30 transform hover:scale-105 transition duration-300">
            <div className="h-48 overflow-hidden">
              <img
                src="https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Sécurité financière"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-amber-100 to-stone-100 rounded-xl p-3 flex-shrink-0">
                  <FileCheck className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Qu'est-ce que TRACFIN ?
                  </h2>
                  <p className="text-slate-700 text-sm leading-relaxed mb-3">
                    Service français de renseignement financier rattaché au ministère de l'Économie.
                    TRACFIN lutte contre les circuits financiers clandestins et le blanchiment d'argent.
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Les professionnels assujettis ont l'obligation légale de déclarer toute opération suspecte.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-stone-200/30 transform hover:scale-105 transition duration-300">
              <div className="h-32 overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="KYC"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-2 w-fit mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  KYC
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vérification des clients et bénéficiaires effectifs
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-stone-200/30 transform hover:scale-105 transition duration-300">
              <div className="h-32 overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Évaluation des risques"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg p-2 w-fit mb-3">
                  <TrendingUp className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Risques
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Scoring et vigilance renforcée
                </p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-stone-200/30 transform hover:scale-105 transition duration-300">
              <div className="h-32 overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/7567528/pexels-photo-7567528.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Détection d'alertes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-lg p-2 w-fit mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Alertes
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Détection des opérations suspectes
                </p>
              </div>
            </div>
          </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-stone-200/30">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg p-2">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Connexion
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-transparent transition pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition duration-300">
            <img
              src="https://images.pexels.com/photos/7567486/pexels-photo-7567486.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Analyse financière"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-lg font-bold mb-1">Analyse approfondie</h3>
                <p className="text-sm text-white/90">Surveillance continue des transactions</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition duration-300">
            <img
              src="https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Sécurité des données"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-lg font-bold mb-1">Données sécurisées</h3>
                <p className="text-sm text-white/90">Protection maximale des informations</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition duration-300">
            <img
              src="https://images.pexels.com/photos/8297031/pexels-photo-8297031.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Conformité réglementaire"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <div className="text-white">
                <h3 className="text-lg font-bold mb-1">Conformité totale</h3>
                <p className="text-sm text-white/90">Respect des normes européennes</p>
              </div>
            </div>
          </div>

          <div className="text-center text-slate-600 text-xs bg-white/50 backdrop-blur-sm rounded-xl py-3 px-6 inline-block mx-auto">
            <p>
              Conformité LCB-FT selon les directives européennes et françaises
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
