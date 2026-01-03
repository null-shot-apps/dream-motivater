'use client';

import { useApp } from '@/contexts/AppContext';
import { aiService } from '@/services/aiService';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { isOnboarded, setUserProfile, completeOnboarding, setRoadmap } = useApp();

  const handleOnboardingComplete = (profile: any) => {
    setUserProfile(profile);
    
    // Generate initial roadmap using AI
    const roadmap = aiService.generateRoadmap(profile);
    setRoadmap(roadmap);
    
    completeOnboarding();
  };

  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Dashboard />;
}

