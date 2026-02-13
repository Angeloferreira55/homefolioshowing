import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasCreatedFirstSession: boolean;
  currentStep: number;
  showTour: boolean;
  completedSteps: number[]; // Array of completed step indices
}

const ONBOARDING_STORAGE_KEY = 'homefolio_onboarding_state';

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    hasCreatedFirstSession: false,
    currentStep: 0,
    showTour: false,
    completedSteps: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check localStorage first (faster)
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        setOnboardingState(state);
        setLoading(false);
        return;
      }

      // Check if user has any sessions (indicates they've used the app)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: sessions, error } = await (supabase
        .from('showing_sessions')
        .select('id') as any)
        .eq('admin_id', user.id)
        .limit(1);

      if (error) {
        console.error('Error checking onboarding status:', error);
        setLoading(false);
        return;
      }

      const hasCreatedSession = sessions && sessions.length > 0;

      const newState: OnboardingState = {
        hasCompletedOnboarding: hasCreatedSession,
        hasCreatedFirstSession: hasCreatedSession,
        currentStep: 0,
        showTour: !hasCreatedSession,
        completedSteps: [],
      };

      setOnboardingState(newState);
      saveOnboardingState(newState);
      setLoading(false);
    } catch (error) {
      console.error('Error in checkOnboardingStatus:', error);
      setLoading(false);
    }
  };

  const saveOnboardingState = (state: OnboardingState) => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    setOnboardingState(state);
  };

  const completeOnboarding = () => {
    const newState: OnboardingState = {
      ...onboardingState,
      hasCompletedOnboarding: true,
      showTour: false,
    };
    saveOnboardingState(newState);
  };

  const skipOnboarding = () => {
    const newState: OnboardingState = {
      ...onboardingState,
      hasCompletedOnboarding: true,
      showTour: false,
    };
    saveOnboardingState(newState);
  };

  const startTour = () => {
    const newState: OnboardingState = {
      ...onboardingState,
      showTour: true,
      currentStep: 0,
    };
    saveOnboardingState(newState);
  };

  const nextStep = () => {
    const newState: OnboardingState = {
      ...onboardingState,
      currentStep: onboardingState.currentStep + 1,
    };
    saveOnboardingState(newState);
  };

  const prevStep = () => {
    const newState: OnboardingState = {
      ...onboardingState,
      currentStep: Math.max(0, onboardingState.currentStep - 1),
    };
    saveOnboardingState(newState);
  };

  const setStep = (step: number) => {
    const newState: OnboardingState = {
      ...onboardingState,
      currentStep: step,
    };
    saveOnboardingState(newState);
  };

  const markFirstSessionCreated = () => {
    const newState: OnboardingState = {
      ...onboardingState,
      hasCreatedFirstSession: true,
    };
    saveOnboardingState(newState);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setOnboardingState({
      hasCompletedOnboarding: false,
      hasCreatedFirstSession: false,
      currentStep: 0,
      showTour: false,
      completedSteps: [],
    });
  };

  const markStepComplete = (stepIndex: number) => {
    if (!onboardingState.completedSteps.includes(stepIndex)) {
      const newState: OnboardingState = {
        ...onboardingState,
        completedSteps: [...onboardingState.completedSteps, stepIndex],
      };
      saveOnboardingState(newState);
    }
  };

  const isStepComplete = (stepIndex: number) => {
    return onboardingState.completedSteps.includes(stepIndex);
  };

  return {
    ...onboardingState,
    loading,
    completeOnboarding,
    skipOnboarding,
    startTour,
    nextStep,
    prevStep,
    setStep,
    markFirstSessionCreated,
    resetOnboarding,
    markStepComplete,
    isStepComplete,
  };
}
