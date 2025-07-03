'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface DKCPAnalysisProps {
  analysis: {
    activity?: string;
    score?: number;
    conflicts?: Array<{
      id: string;
      description: string;
      driver: string;
      barrier: string;
    }>;
  };
  onClose: () => void;
}

export function DKCPAnalysis({ analysis, onClose }: DKCPAnalysisProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold">DKCP Analysis</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {analysis.activity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{analysis.activity}</p>
          </CardContent>
        </Card>
      )}

      {analysis.score !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {analysis.score}/100
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.conflicts && analysis.conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Key Motivational Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.conflicts.map((conflict) => (
                <div key={conflict.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline" className="mb-2">
                      {conflict.id}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{conflict.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-green-600">Driver:</span> {conflict.driver}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Barrier:</span> {conflict.barrier}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 