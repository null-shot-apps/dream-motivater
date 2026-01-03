'use client';

import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService } from '@/services/aiService';
import { enhancedAIService } from '@/services/enhancedAIService';
import { getAIConfig } from '@/config/ai-config';
import SmartOnboarding from '@/components/SmartOnboarding';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { isOnboarded, setUserProfile, completeOnboarding, setRoadmap } = useApp();

  // Initialize AI service with API keys
  useEffect(() => {
    const config = getAIConfig();
    enhancedAIService.initialize(config);
  }, []);

  const handleOnboardingComplete = (profile: any) => {
    setUserProfile(profile);
    
    // Generate initial roadmap using AI
    const roadmap = aiService.generateRoadmap(profile);
    setRoadmap(roadmap);
    
    completeOnboarding();
  };

  if (!isOnboarded) {
    return <SmartOnboarding onComplete={handleOnboardingComplete} useEnhanced={true} />;
  }

  return <Dashboard />;
}



