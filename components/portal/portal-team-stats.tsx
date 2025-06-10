'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamStats {
  totalAgents: number;
  activeAgents: number;
  departmentBreakdown: Array<{
    department: string;
    count: number;
    color: string;
  }>;
}

interface PortalTeamStatsProps {
  stats: TeamStats;
  className?: string;
}

export function PortalTeamStats({ 
  stats, 
  className 
}: PortalTeamStatsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 text-blue-500 mr-2" />
            Team Overview
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Total Agents</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAgents}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Active Now</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.activeAgents}</p>
            </div>
          </div>

          {/* Status Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Agent Status</h4>
                <p className="text-sm text-gray-600">
                  {stats.activeAgents} of {stats.totalAgents} agents are currently active
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-700">
                  {stats.totalAgents > 0 ? Math.round((stats.activeAgents / stats.totalAgents) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500">Active Rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Building className="h-5 w-5 text-purple-500 mr-2" />
            Department Breakdown
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {stats.departmentBreakdown.length > 0 ? (
            <div className="space-y-3">
              {stats.departmentBreakdown.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    />
                    <div>
                      <p className="font-medium capitalize">{dept.department}</p>
                    </div>
                  </div>
                  
                  <Badge variant="outline">
                    {dept.count} agent{dept.count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No departments configured yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 