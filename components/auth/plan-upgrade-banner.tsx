'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, Users, ArrowRight, X } from 'lucide-react';
import { PlanPickerModal } from './plan-picker-modal';

interface PlanUpgradeBannerProps {
  currentPlan?: 'FREE' | 'PREMIUM' | 'TEAM';
  tokensUsed?: number;
  tokenQuota?: number;
  onUpgrade?: (plan: string) => void;
  className?: string;
}

const planIcons = {
  FREE: Zap,
  PREMIUM: Crown,
  TEAM: Users
};

const planColors = {
  FREE: 'text-green-600',
  PREMIUM: 'text-blue-600', 
  TEAM: 'text-purple-600'
};

export function PlanUpgradeBanner({ 
  currentPlan = 'FREE', 
  tokensUsed = 0, 
  tokenQuota = 20,
  onUpgrade,
  className = ''
}: PlanUpgradeBannerProps) {
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const Icon = planIcons[currentPlan];
  const tokensRemaining = tokenQuota - tokensUsed;
  const percentUsed = (tokensUsed / tokenQuota) * 100;
  const isLowOnTokens = tokensRemaining <= 5;

  const getUpgradeMessage = () => {
    if (currentPlan === 'FREE') {
      if (isLowOnTokens) {
        return {
          title: 'Running low on tokens!',
          description: `You have ${tokensRemaining} tokens left this month. Upgrade to Pro for 1,000 tokens.`,
          urgent: true
        };
      }
      return {
        title: 'You\'re on the Free plan',
        description: 'Upgrade to Pro for 50x more tokens and advanced features.',
        urgent: false
      };
    }
    
    if (currentPlan === 'PRO') {
      return {
        title: 'You\'re on the Pro plan',
        description: 'Upgrade to Team for unlimited agents and collaboration features.',
        urgent: false
      };
    }

    return null;
  };

  const upgradeMessage = getUpgradeMessage();
  
  // Don't show banner for Team plan users unless they're low on tokens
  if (!upgradeMessage) return null;

  return (
    <>
      <Card className={`${className} ${upgradeMessage.urgent ? 'border-orange-200 bg-orange-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${upgradeMessage.urgent ? 'bg-orange-100' : 'bg-blue-100'}`}>
                <Icon className={`h-4 w-4 ${upgradeMessage.urgent ? 'text-orange-600' : planColors[currentPlan]}`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{upgradeMessage.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {currentPlan}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {upgradeMessage.description}
                </p>
                
                {currentPlan === 'FREE' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            percentUsed > 80 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                      <span>{tokensUsed}/{tokenQuota} tokens</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlanPicker(true)}
                className="text-xs"
              >
                View Plans
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PlanPickerModal
        isOpen={showPlanPicker}
        onClose={() => setShowPlanPicker(false)}
        currentPlan={currentPlan}
        onUpgrade={onUpgrade}
      />
    </>
  );
} 