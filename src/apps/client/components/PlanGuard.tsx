/* ===================================================
   PlanGuard - Limite l'accès selon le plan
   Affiche un message d'upgrade si feature non disponible
   ================================================= */

import { ReactNode, useEffect, useState } from 'react';
import { useTenant } from '@/shared/contexts/TenantContext';
import { supabase } from '@/shared/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlanGuardProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PlanGuard = ({ feature, children, fallback }: PlanGuardProps) => {
  const { tenant } = useTenant();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      if (!tenant?.plan_id) {
        // Pas de plan = accès limité
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: plan } = await supabase
          .from('pricing_plans')
          .select('name, features')
          .eq('id', tenant.plan_id)
          .single();

        if (plan) {
          setPlanName(plan.name);
          // Vérifier si la feature est dans la liste
          const features = plan.features || [];
          setHasAccess(features.includes(feature));
        }
      } catch (error) {
        console.error('Error checking plan:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [tenant, feature]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
    </div>;
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-radial-darker flex items-center justify-center p-6"
      >
        <Card className="glass-card border-yellow-500/20 max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-white">
              Fonctionnalité Premium
            </CardTitle>
            <CardDescription className="text-slate-400">
              Cette fonctionnalité nécessite un plan supérieur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-slate-300 mb-2">
                <strong>Feature:</strong> {feature}
              </p>
              {planName && (
                <p className="text-sm text-slate-300">
                  <strong>Votre plan actuel:</strong> {planName}
                </p>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              onClick={() => {
                // TODO: Rediriger vers page pricing ou contact
                window.location.href = 'mailto:contact@b2santos.fr?subject=Upgrade%20Plan';
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Passer à un plan supérieur
            </Button>

            <p className="text-xs text-center text-slate-500">
              Contactez-nous pour en savoir plus
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return <>{children}</>;
};
