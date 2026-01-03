'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService, UserProfile } from '@/services/aiService';
import Onboarding from '@/components/Onboarding';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { isOnboarded, setUserProfile, completeOnboarding, setRoadmap } = useApp();
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const handleOnboardingComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    setIsGeneratingRoadmap(true);
    
    try {
      // Generate initial roadmap using AI
      const roadmap = await aiService.generateRoadmap(profile);
      setRoadmap(roadmap);
      completeOnboarding();
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      // Still complete onboarding even if roadmap generation fails
      completeOnboarding();
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (!isOnboarded) {
    return (
      <>
        <Onboarding onComplete={handleOnboardingComplete} />
        {isGeneratingRoadmap && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-lg font-semibold">Generating your personalized roadmap...</p>
              <p className="text-white/60 text-sm mt-2">This may take a moment</p>
            </div>
          </div>
        )}
      </>
    );
  }

  return <Dashboard />;
}

