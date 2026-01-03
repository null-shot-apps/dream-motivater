'use client';

import { useState } from 'react';
import Onboarding from './Onboarding';
import EnhancedOnboarding from './EnhancedOnboarding';
import { UserProfile } from '@/services/aiService';
import { EnhancedUserProfile } from '@/services/enhancedAIService';

interface SmartOnboardingProps {
  onComplete: (profile: UserProfile) => void;
  useEnhanced?: boolean;
}

export default function SmartOnboarding({ onComplete, useEnhanced = true }: SmartOnboardingProps) {
  const handleEnhancedComplete = (enhancedProfile: EnhancedUserProfile) => {
    // Convert enhanced profile to standard profile
    const standardProfile: UserProfile = {
      mainGoal: enhancedProfile.primaryGoals[0] || '',
      secondaryGoal: enhancedProfile.secondaryGoals[0] || '',
      experienceLevel: enhancedProfile.experienceLevel,
      weeklyHours: enhancedProfile.weeklyHours,
      pastSkills: enhancedProfile.skills,
      learningStyle: enhancedProfile.learningStyle,
    };

    onComplete(standardProfile);
  };

  if (useEnhanced) {
    return <EnhancedOnboarding onComplete={handleEnhancedComplete} />;
  }

  return <Onboarding onComplete={onComplete} />;
}

