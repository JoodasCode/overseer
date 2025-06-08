import { Metadata } from 'next';
import { getProviders } from 'next-auth/react';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign In - Overseer',
  description: 'Sign in to your Overseer account',
};

export default async function SignInPage() {
  const providers = await getProviders();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#9bbc0f] font-pixel">
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left Panel - Pixel Art Background */}
        <div className="relative hidden h-full flex-col p-10 lg:flex dark:border-r border-[#9bbc0f]">
          <div className="absolute inset-0 bg-[#0f0f0f] opacity-90" />
          <div className="relative z-20 flex items-center text-lg font-pixel">
            <div className="w-8 h-8 mr-2 bg-[#9bbc0f] animate-pulse" />
            OVERSEER
          </div>
          <div className="relative z-20 mt-auto">
            <div className="p-4 border-2 border-[#9bbc0f] bg-[#0f0f0f]">
              <p className="text-lg font-pixel">
                "Overseer has transformed how we manage our AI agents. The platform is intuitive, powerful, and exactly what we needed."
              </p>
              <footer className="mt-2 text-sm font-pixel">Sofia Davis</footer>
            </div>
          </div>
        </div>

        {/* Right Panel - Sign In Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-pixel tracking-tight border-b-2 border-[#9bbc0f] pb-2">
                WELCOME BACK
              </h1>
              <p className="text-sm text-[#9bbc0f]/80 font-pixel">
                Sign in to your account to continue
              </p>
            </div>
            <SignInForm providers={providers} />
            <p className="px-8 text-center text-sm text-[#9bbc0f]/80 font-pixel">
              By clicking continue, you agree to our{' '}
              <a
                href="/terms"
                className="underline underline-offset-4 hover:text-[#9bbc0f]"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="underline underline-offset-4 hover:text-[#9bbc0f]"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 