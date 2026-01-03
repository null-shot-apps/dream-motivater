'use client';

import { useState } from 'react';
import { UserProfile } from '@/services/aiService';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    pastSkills: [],
  });

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    const current = profile.pastSkills || [];
    if (current.includes(skill)) {
      updateProfile('pastSkills', current.filter(s => s !== skill));
    } else {
      updateProfile('pastSkills', [...current, skill]);
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      onComplete(profile as UserProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!profile.mainGoal;
      case 2: return !!profile.secondaryGoal;
      case 3: return !!profile.experienceLevel;
      case 4: return !!profile.weeklyHours;
      case 5: return true; // pastSkills is optional
      case 6: return !!profile.learningStyle;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-white/80 text-sm">Step {step} of 6</span>
            <span className="text-white/80 text-sm">{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Main Goal */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">What&apos;s your main career goal?</h2>
            <p className="text-white/70 mb-6">Choose the role you&apos;re aiming for</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'Data Scientist',
                'Mobile Developer',
                'DevOps Engineer',
              ].map(goal => (
                <button
                  key={goal}
                  onClick={() => updateProfile('mainGoal', goal)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    profile.mainGoal === goal
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Secondary Goal */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">Any secondary interests?</h2>
            <p className="text-white/70 mb-6">This helps us personalize your learning path</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'UI/UX Design',
                'Cloud Architecture',
                'Machine Learning',
                'Cybersecurity',
                'Blockchain',
                'Game Development',
              ].map(goal => (
                <button
                  key={goal}
                  onClick={() => updateProfile('secondaryGoal', goal)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    profile.secondaryGoal === goal
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Experience Level */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">What&apos;s your experience level?</h2>
            <p className="text-white/70 mb-6">Be honest - we&apos;ll tailor the content to you</p>
            <div className="space-y-4">
              {[
                { value: 'beginner', label: 'Beginner', desc: 'Just starting out or switching careers' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Some coding experience, building projects' },
                { value: 'advanced', label: 'Advanced', desc: 'Professional experience, looking to level up' },
              ].map(level => (
                <button
                  key={level.value}
                  onClick={() => updateProfile('experienceLevel', level.value)}
                  className={`w-full p-6 rounded-xl text-left transition-all ${
                    profile.experienceLevel === level.value
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <div className="font-semibold text-lg mb-1">{level.label}</div>
                  <div className="text-sm opacity-80">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Weekly Hours */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">How much time can you commit?</h2>
            <p className="text-white/70 mb-6">Hours per week for learning and practice</p>
            <div className="space-y-4">
              {[
                { value: 5, label: '5 hours/week', desc: 'Casual pace, steady progress' },
                { value: 10, label: '10 hours/week', desc: 'Balanced approach, good momentum' },
                { value: 20, label: '20 hours/week', desc: 'Intensive learning, fast progress' },
                { value: 40, label: '40+ hours/week', desc: 'Full-time commitment, rapid growth' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => updateProfile('weeklyHours', option.value)}
                  className={`w-full p-6 rounded-xl text-left transition-all ${
                    profile.weeklyHours === option.value
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <div className="font-semibold text-lg mb-1">{option.label}</div>
                  <div className="text-sm opacity-80">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Past Skills */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">What skills do you already have?</h2>
            <p className="text-white/70 mb-6">Select all that apply - we&apos;ll skip what you know</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Python',
                'Git', 'SQL', 'TypeScript', 'APIs', 'Testing', 'Docker',
              ].map(skill => (
                <button
                  key={skill}
                  onClick={() => handleSkillToggle(skill)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    profile.pastSkills?.includes(skill)
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Learning Style */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">How do you learn best?</h2>
            <p className="text-white/70 mb-6">We&apos;ll prioritize resources that match your style</p>
            <div className="space-y-4">
              {[
                { value: 'visual', label: 'Visual', desc: 'Videos, diagrams, and demonstrations' },
                { value: 'hands-on', label: 'Hands-on', desc: 'Practice exercises and building projects' },
                { value: 'reading', label: 'Reading', desc: 'Articles, documentation, and books' },
                { value: 'mixed', label: 'Mixed', desc: 'Combination of all learning methods' },
              ].map(style => (
                <button
                  key={style.value}
                  onClick={() => updateProfile('learningStyle', style.value)}
                  className={`w-full p-6 rounded-xl text-left transition-all ${
                    profile.learningStyle === style.value
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <div className="font-semibold text-lg mb-1">{style.label}</div>
                  <div className="text-sm opacity-80">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-lg bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            {step === 6 ? 'Start Learning' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}


