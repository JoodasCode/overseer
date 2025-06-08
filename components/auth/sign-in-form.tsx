'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SignInFormProps {
  providers: any;
}

export function SignInForm({ providers }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn('email', {
        email,
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs defaultValue="email" className="w-full">
      <TabsList className="grid w-full grid-cols-2 border-2 border-[#9bbc0f] bg-[#0f0f0f]">
        <TabsTrigger 
          value="email"
          className="data-[state=active]:bg-[#9bbc0f] data-[state=active]:text-[#0f0f0f] font-pixel"
        >
          EMAIL
        </TabsTrigger>
        <TabsTrigger 
          value="social"
          className="data-[state=active]:bg-[#9bbc0f] data-[state=active]:text-[#0f0f0f] font-pixel"
        >
          SOCIAL
        </TabsTrigger>
      </TabsList>
      <TabsContent value="email">
        <Card className="border-2 border-[#9bbc0f] bg-[#0f0f0f]">
          <CardHeader>
            <CardTitle className="font-pixel text-[#9bbc0f]">SIGN IN WITH EMAIL</CardTitle>
            <CardDescription className="font-pixel text-[#9bbc0f]/80">
              Enter your email below to sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-pixel text-[#9bbc0f]">EMAIL</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-2 border-[#9bbc0f] bg-[#0f0f0f] text-[#9bbc0f] font-pixel placeholder:text-[#9bbc0f]/50 focus:ring-[#9bbc0f]"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[#9bbc0f] text-[#0f0f0f] hover:bg-[#9bbc0f]/90 font-pixel border-2 border-[#9bbc0f]"
                >
                  {isLoading ? (
                    <span className="animate-pulse">LOADING...</span>
                  ) : (
                    'SIGN IN WITH EMAIL'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="social">
        <Card className="border-2 border-[#9bbc0f] bg-[#0f0f0f]">
          <CardHeader>
            <CardTitle className="font-pixel text-[#9bbc0f]">SIGN IN WITH SOCIAL</CardTitle>
            <CardDescription className="font-pixel text-[#9bbc0f]/80">
              Choose your preferred social login method
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {providers?.google && (
              <Button
                variant="outline"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                disabled={isLoading}
                className="border-2 border-[#9bbc0f] bg-[#0f0f0f] text-[#9bbc0f] hover:bg-[#9bbc0f] hover:text-[#0f0f0f] font-pixel"
              >
                {isLoading ? (
                  <span className="animate-pulse">LOADING...</span>
                ) : (
                  'CONTINUE WITH GOOGLE'
                )}
              </Button>
            )}
            {providers?.github && (
              <Button
                variant="outline"
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                disabled={isLoading}
                className="border-2 border-[#9bbc0f] bg-[#0f0f0f] text-[#9bbc0f] hover:bg-[#9bbc0f] hover:text-[#0f0f0f] font-pixel"
              >
                {isLoading ? (
                  <span className="animate-pulse">LOADING...</span>
                ) : (
                  'CONTINUE WITH GITHUB'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 