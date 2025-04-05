import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Incident } from '@/types';

// Interface for the risk score from the backend
interface RiskScoreResult {
  predictedSeverity: 'critical' | 'high' | 'medium' | 'low';
  confidenceScore: number;
  riskFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  analysisRationale: string;
}

interface SeverityPredictorProps {
  incident?: Partial<Incident>;
  incidentId?: number;
  onPredictionComplete?: (result: RiskScoreResult) => void;
  className?: string;
}

export const SeverityPredictor = ({
  incident,
  incidentId,
  onPredictionComplete,
  className = '',
}: SeverityPredictorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prediction, setPrediction] = useState<RiskScoreResult | null>(null);

  // Mutation for predicting severity based on incident data
  const predictMutation = useMutation({
    mutationFn: async (): Promise<RiskScoreResult> => {
      // If we have an ID, use the GET endpoint, otherwise use POST with incident data
      if (incidentId) {
        return apiRequest<RiskScoreResult>(`/api/incidents/${incidentId}/predict-severity`, {
          method: 'GET',
        });
      } else if (incident) {
        return apiRequest<RiskScoreResult>('/api/incidents/predict-severity', {
          method: 'POST',
          body: JSON.stringify(incident),
        });
      } else {
        throw new Error('Either incident data or incident ID is required');
      }
    },
    onSuccess: (data) => {
      setPrediction(data);
      if (onPredictionComplete) {
        onPredictionComplete(data);
      }
      toast({
        title: 'Risk Analysis Complete',
        description: `Predicted severity: ${data.predictedSeverity.toUpperCase()}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Risk Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Get the severity icon based on the level
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'medium':
        return <Shield className="h-6 w-6 text-amber-500" />;
      case 'low':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircle2 className="h-6 w-6 text-slate-500" />;
    }
  };

  // Get severity color class
  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  // Get severity text color class
  const getSeverityTextClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-slate-500';
    }
  };

  // Get severity badge variant
  const getSeverityBadgeVariant = (severity: string): 'destructive' | 'default' | 'outline' | 'secondary' => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>AI Risk Analysis</span>
          {!prediction && (
            <Button
              size="sm"
              onClick={() => predictMutation.mutate()}
              disabled={predictMutation.isPending}
            >
              {predictMutation.isPending ? 'Analyzing...' : 'Analyze Risk'}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {prediction
            ? 'AI-powered risk analysis based on incident details'
            : 'Get AI-powered risk analysis for this security incident'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        {predictMutation.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : prediction ? (
          <div className="space-y-6">
            {/* Severity indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getSeverityIcon(prediction.predictedSeverity)}
                <div>
                  <h4 className="font-semibold">Predicted Severity</h4>
                  <p className={`text-lg font-bold uppercase ${getSeverityTextClass(prediction.predictedSeverity)}`}>
                    {prediction.predictedSeverity}
                  </p>
                </div>
              </div>
              <Badge variant={getSeverityBadgeVariant(prediction.predictedSeverity)}>
                {Math.round(prediction.confidenceScore * 100)}% Confidence
              </Badge>
            </div>

            {/* Risk factors */}
            <div>
              <h4 className="mb-3 font-semibold">Key Risk Factors</h4>
              <div className="space-y-3">
                {prediction.riskFactors.map((factor, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{factor.factor}</span>
                      <span className="text-sm text-slate-500">{Math.round(factor.impact * 100)}%</span>
                    </div>
                    <Progress
                      value={factor.impact * 100}
                      className={`h-2 ${getSeverityColorClass(prediction.predictedSeverity)}`}
                    />
                    <p className="text-sm text-slate-500">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis rationale */}
            <div>
              <h4 className="mb-2 font-semibold">Analysis Rationale</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">{prediction.analysisRationale}</p>
            </div>

            {/* Re-analyze button */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => predictMutation.mutate()}
                disabled={predictMutation.isPending}
              >
                Re-analyze
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <Shield className="h-12 w-12 text-slate-300" />
            <div>
              <p className="text-slate-500">Click the "Analyze Risk" button to generate an AI-powered risk assessment.</p>
              <p className="mt-2 text-sm text-slate-400">
                The analysis will predict severity and identify risk factors based on incident details.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};