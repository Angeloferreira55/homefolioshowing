import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTooltipProps {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip: () => void;
  onComplete?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlightElement?: boolean;
  isStepComplete?: boolean;
  completionMessage?: string;
  allowSidebarInteraction?: boolean;
}

function OnboardingTooltip({
  title,
  description,
  step,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  position = 'bottom',
  highlightElement = false,
  isStepComplete = true,
  completionMessage,
  allowSidebarInteraction = false,
}: OnboardingTooltipProps) {
  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;

  return (
    <>
      {/* Backdrop overlay - when allowing sidebar interaction, only cover main content */}
      <div
        className={cn(
          "fixed bg-black/50 z-[60]",
          allowSidebarInteraction
            ? "left-64 right-0 top-0 bottom-0" // Only cover main content, leave sidebar accessible
            : "inset-0" // Cover everything
        )}
        onClick={onSkip}
      />

      {/* Tooltip positioned in center */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md">
          <div className="bg-card border-2 border-primary rounded-xl shadow-2xl p-6">
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progress indicator */}
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary">
                Step {step} of {totalSteps}
              </span>
            </div>
            <h3 className="font-semibold text-lg text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {isLastStep ? (
              <Button
                onClick={onComplete}
                size="sm"
                className="gap-1"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={onNext}
                size="sm"
                className="gap-1"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

export default OnboardingTooltip;
