'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/supabase-auth-provider';
import { Loader2, Github, Mail } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp, signInWithGoogle, signInWithGitHub, resetPassword } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
      setEmail('');
      setPassword('');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a confirmation link!');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Note: For OAuth, the user will be redirected, so we don't need to handle success here
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    setError(null);
    
    const { error } = await signInWithGitHub();
    
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Note: For OAuth, the user will be redirected, so we don't need to handle success here
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset email sent! Check your inbox.');
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-pixel">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center text-lg">
            {activeTab === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as 'signin' | 'signup');
          resetForm();
        }}>
          <TabsList className="grid w-full grid-cols-2 border-2 border-[#9bbc0f] bg-[#0f0f0f]">
            <TabsTrigger 
              value="signin"
              className="data-[state=active]:bg-[#9bbc0f] data-[state=active]:text-[#0f0f0f] font-pixel"
            >
              SIGN IN
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="data-[state=active]:bg-[#9bbc0f] data-[state=active]:text-[#0f0f0f] font-pixel"
            >
              SIGN UP
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertDescription className="font-pixel text-xs text-red-500">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="border-green-500 bg-green-500/10">
              <AlertDescription className="font-pixel text-xs text-green-500">
                {message}
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="font-pixel text-xs">EMAIL</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="border-pixel font-clean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="font-pixel text-xs">PASSWORD</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="border-pixel font-clean"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full font-pixel text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SIGNING IN...
                  </>
                ) : (
                  'SIGN IN'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                onClick={handleResetPassword}
                disabled={loading}
                className="font-pixel text-xs text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-pixel">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="font-pixel text-xs"
              >
                <Mail className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={handleGitHubSignIn}
                disabled={loading}
                className="font-pixel text-xs"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-pixel text-xs">EMAIL</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="border-pixel font-clean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="font-pixel text-xs">PASSWORD</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="border-pixel font-clean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="font-pixel text-xs">CONFIRM PASSWORD</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="border-pixel font-clean"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full font-pixel text-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-pixel">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="font-pixel text-xs"
              >
                <Mail className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={handleGitHubSignIn}
                disabled={loading}
                className="font-pixel text-xs"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 