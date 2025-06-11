'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  // Common navigation suggestions
  const commonRoutes = [
    { path: '/dashboard', label: 'Dashboard', description: 'Main overview' },
    { path: '/agents', label: 'Agents', description: 'Manage AI agents' },
    { path: '/tasks', label: 'Tasks', description: 'Task management' },
    { path: '/analytics', label: 'Analytics', description: 'Performance insights' },
    { path: '/integrations', label: 'Integrations', description: 'Connected services' },
    { path: '/settings', label: 'Settings', description: 'Account settings' }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full mb-4"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.back()} 
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">Quick navigation:</p>
            <div className="grid grid-cols-2 gap-2">
              {commonRoutes.map((route) => (
                <Button
                  key={route.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(route.path)}
                  className="justify-start text-xs"
                >
                  {route.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 