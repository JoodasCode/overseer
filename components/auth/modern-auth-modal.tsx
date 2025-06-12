'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ModernAuthForm } from './modern-auth-form';

interface ModernAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export function ModernAuthModal({ isOpen, onClose, defaultTab = 'signin' }: ModernAuthModalProps) {
  const router = useRouter();

  const handleAuthSuccess = () => {
    console.log('🎉 Auth modal: Sign-in successful, redirecting to dashboard');
    onClose();
    // Explicitly redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none">
        <ModernAuthForm 
          defaultTab={defaultTab} 
          onSuccess={handleAuthSuccess}
        />
      </DialogContent>
    </Dialog>
  );
} 