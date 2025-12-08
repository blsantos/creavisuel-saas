import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant, useBranding } from '@/shared/contexts/TenantContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from '@/shared/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const branding = useBranding();
  const { signIn, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        toast({
          title: 'Erreur de connexion',
          description: error.message || 'Email ou mot de passe incorrect',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connexion réussie',
          description: `Bienvenue ${formData.email}`,
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(formData.email);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible d\'envoyer l\'email',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email envoyé',
          description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
        });
        setShowForgotPassword(false);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer l\'email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!tenant || !branding) {
    return (
      <div className="min-h-screen bg-radial-darker flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-darker particle-bg circuit-lines flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-cyan-500/20">
          <CardHeader className="text-center pb-6">
            {branding.logoUrl && (
              <motion.img
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                src={branding.logoUrl}
                alt={branding.companyName}
                className="h-16 w-auto object-contain mx-auto mb-4"
              />
            )}
            <CardTitle className="text-2xl font-bold text-white neon-text">
              {showForgotPassword ? 'Mot de passe oublié' : 'Connexion'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {showForgotPassword
                ? 'Entrez votre email pour recevoir un lien de réinitialisation'
                : `Accédez à votre espace ${branding.companyName}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-slate-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-slate-400 hover:text-white"
                    onClick={() => setShowForgotPassword(false)}
                    disabled={isLoading}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      'Envoyer le lien'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-slate-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    autoComplete="current-password"
                    className="bg-white/5 border-cyan-500/30 text-white placeholder:text-slate-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-cyan-400 hover:text-cyan-300 transition"
                    disabled={isLoading}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold pulse-ring"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Propulsé par {branding.companyName}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
