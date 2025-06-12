'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Users, X } from 'lucide-react';

interface PlanPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: 'FREE' | 'PRO' | 'TEAM';
  onUpgrade?: (plan: string) => void;
}

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Best for sampling everything Agent OS offers',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    features: [
      '20 tokens per month',
      'Access all public agents',
      'All core features (chat, memory, tasks)',
      'Knowledge Base access',
      'Automate up to 3 tasks',
      'Plugin syncs (rate-limited)',
      'Basic usage dashboard'
    ],
    limitations: [
      'Temporary agent memory (resets every 3 days)',
      'Limited to 20 tokens/month',
      'Rate-limited plugin syncs'
    ]
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '$20',
    period: 'per month',
    description: 'For serious individual operators',
    icon: Crown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    popular: true,
    features: [
      '1,000 tokens per month',
      'Unlimited agent access',
      'Full persistent memory',
      'Unlimited automations & plugin syncs',
      'Workflow builder',
      'Knowledge base writing & editing',
      'Priority support',
      'Advanced analytics'
    ],
    limitations: []
  },
  {
    id: 'TEAM',
    name: 'Team',
    price: '$80',
    period: 'per month',
    description: 'For lean teams running ops at scale',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Everything in Premium',
      'Up to 5 users included',
      'Team agent memory',
      'Cross-agent workflows',
      'Plugin orchestration (Gmail → Slack → Notion)',
      'Team usage dashboard',
      'Admin controls & limits'
    ],
    limitations: []
  }
];

export function PlanPickerModal({ isOpen, onClose, currentPlan = 'FREE', onUpgrade }: PlanPickerModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);

  const handleUpgrade = () => {
    if (onUpgrade && selectedPlan !== currentPlan) {
      onUpgrade(selectedPlan);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Choose Your Plan</DialogTitle>
              <p className="text-muted-foreground mt-1">
                You're currently on the <Badge variant="outline">{currentPlan}</Badge> plan
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;
            const isSelected = plan.id === selectedPlan;
            
            return (
              <Card 
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? `ring-2 ring-primary ${plan.borderColor}` : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto rounded-full ${plan.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <X className="h-3 w-3 text-red-400 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-4">
                    {isCurrentPlan ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        variant={isSelected ? "default" : "outline"} 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan.id);
                        }}
                      >
                        {plan.id === 'FREE' ? 'Downgrade' : 'Select Plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            All plans include secure data handling and regular updates
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
            {selectedPlan !== currentPlan && (
              <Button onClick={handleUpgrade}>
                {selectedPlan === 'FREE' ? 'Downgrade to Free' : `Upgrade to ${selectedPlan}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 