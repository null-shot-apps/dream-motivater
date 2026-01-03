'use client';

import { useState, useRef } from 'react';
import { EnhancedUserProfile, enhancedAIService } from '@/services/enhancedAIService';
import { parseDocument, validateFile } from '@/utils/fileUtils';

interface EnhancedOnboardingProps {
  onComplete: (profile: EnhancedUserProfile) => void;
}

export default function EnhancedOnboarding({ onComplete }: EnhancedOnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<EnhancedUserProfile>>({
    primaryGoals: [],
    secondaryGoals: [],
    skills: [],
  });

  // Search states
  const [goalSearch, setGoalSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);

  // File upload states
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingRoadmap, setUploadingRoadmap] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const roadmapInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = (key: keyof EnhancedUserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleGoalSearch = (query: string) => {
    setGoalSearch(query);
    if (query.length > 0) {
      const suggestions = enhancedAIService.searchGoals(query);
      setGoalSuggestions(suggestions);
    } else {
      setGoalSuggestions([]);
    }
  };

  const handleSkillSearch = (query: string) => {
    setSkillSearch(query);
    if (query.length > 0) {
      const suggestions = enhancedAIService.searchSkills(query);
      setSkillSuggestions(suggestions);
    } else {
      setSkillSuggestions([]);
    }
  };

  const addPrimaryGoal = (goal: string) => {
    // Handle custom goals (remove the "✨ Add ... (custom)" prefix)
    let cleanGoal = goal;
    if (goal.startsWith('✨ Add "') && goal.endsWith('" (custom)')) {
      cleanGoal = goal.slice(7, -10); // Extract the actual goal text
    }
    
    if (!profile.primaryGoals?.includes(cleanGoal)) {
      updateProfile('primaryGoals', [...(profile.primaryGoals || []), cleanGoal]);
    }
    setGoalSearch('');
    setGoalSuggestions([]);
  };

  const removePrimaryGoal = (goal: string) => {
    updateProfile('primaryGoals', profile.primaryGoals?.filter(g => g !== goal) || []);
  };

  const addSecondaryGoal = (goal: string) => {
    // Handle custom goals (remove the "✨ Add ... (custom)" prefix)
    let cleanGoal = goal;
    if (goal.startsWith('✨ Add "') && goal.endsWith('" (custom)')) {
      cleanGoal = goal.slice(7, -10); // Extract the actual goal text
    }
    
    if (!profile.secondaryGoals?.includes(cleanGoal)) {
      updateProfile('secondaryGoals', [...(profile.secondaryGoals || []), cleanGoal]);
    }
    setGoalSearch('');
    setGoalSuggestions([]);
  };

  const removeSecondaryGoal = (goal: string) => {
    updateProfile('secondaryGoals', profile.secondaryGoals?.filter(g => g !== goal) || []);
  };

  const addSkill = (skill: string) => {
    // Handle custom skills (remove the "✨ Add ... (custom)" prefix)
    let cleanSkill = skill;
    if (skill.startsWith('✨ Add "') && skill.endsWith('" (custom)')) {
      cleanSkill = skill.slice(7, -10); // Extract the actual skill text
    }
    
    if (!profile.skills?.includes(cleanSkill)) {
      updateProfile('skills', [...(profile.skills || []), cleanSkill]);
    }
    setSkillSearch('');
    setSkillSuggestions([]);
  };

  const removeSkill = (skill: string) => {
    updateProfile('skills', profile.skills?.filter(s => s !== skill) || []);
  };

  const handleFileUpload = async (
    file: File,
    type: 'resume' | 'roadmap'
  ) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (type === 'resume') {
      setUploadingResume(true);
    } else {
      setUploadingRoadmap(true);
    }

    try {
      const parsed = await parseDocument(file, type);
      
      if (type === 'resume') {
        updateProfile('uploadedResume', parsed);
        alert('Resume uploaded successfully! AI will analyze it to personalize your experience.');
      } else {
        updateProfile('uploadedRoadmap', parsed);
        alert('Roadmap uploaded successfully! AI will analyze and suggest improvements.');
      }
    } catch (error) {
      alert(`Error uploading file: ${error}`);
    } finally {
      if (type === 'resume') {
        setUploadingResume(false);
      } else {
        setUploadingRoadmap(false);
      }
    }
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    } else {
      onComplete(profile as EnhancedUserProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return (profile.primaryGoals?.length || 0) > 0;
      case 2: return (profile.secondaryGoals?.length || 0) > 0;
      case 3: return !!profile.experienceLevel;
      case 4: return !!profile.weeklyHours;
      case 5: return true; // skills optional
      case 6: return !!profile.learningStyle;
      case 7: return true; // file uploads optional
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-white/80 text-sm">Step {step} of 7</span>
            <span className="text-white/80 text-sm">{Math.round((step / 7) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Primary Goals (Searchable, Multiple) */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">What are your primary career goals?</h2>
            <p className="text-white/70 mb-6">Search and select multiple goals (e.g., Data Analyst + Part-time Age Care)</p>
            
            {/* Selected goals */}
            {(profile.primaryGoals?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.primaryGoals?.map(goal => (
                  <div key={goal} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <span>{goal}</span>
                    <button onClick={() => removePrimaryGoal(goal)} className="hover:text-red-200">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={goalSearch}
                onChange={(e) => handleGoalSearch(e.target.value)}
                placeholder="Search for goals (e.g., Data Analyst, Customer Service)..."
                className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              
              {/* Suggestions dropdown */}
              {goalSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {goalSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => addPrimaryGoal(suggestion)}
                      className="w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-white/60 text-sm">💡 Tip: Type ANY career goal - not just from the list! Custom entries welcome.</p>
          </div>
        )}

        {/* Step 2: Secondary Goals (Searchable, Multiple) */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">Any secondary interests or part-time goals?</h2>
            <p className="text-white/70 mb-6">Add additional goals that complement your primary career path</p>
            
            {/* Selected goals */}
            {(profile.secondaryGoals?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.secondaryGoals?.map(goal => (
                  <div key={goal} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <span>{goal}</span>
                    <button onClick={() => removeSecondaryGoal(goal)} className="hover:text-red-200">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={goalSearch}
                onChange={(e) => handleGoalSearch(e.target.value)}
                placeholder="Search for secondary goals..."
                className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              
              {/* Suggestions dropdown */}
              {goalSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {goalSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => addSecondaryGoal(suggestion)}
                      className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-white/60 text-sm">💡 Tip: Type ANY goal - custom entries welcome! (e.g., &quot;Part-time Barista&quot;, &quot;Freelance Photographer&quot;)</p>
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
                { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, building projects' },
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

        {/* Step 5: Skills (Searchable) */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">What skills do you already have?</h2>
            <p className="text-white/70 mb-6">Search and add your current skills - we&apos;ll personalize your path</p>
            
            {/* Selected skills */}
            {(profile.skills?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills?.map(skill => (
                  <div key={skill} className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                    <span>{skill}</span>
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-200">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => handleSkillSearch(e.target.value)}
                placeholder="Search for skills (e.g., JavaScript, Python, Communication)..."
                className="w-full p-4 rounded-xl bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              
              {/* Suggestions dropdown */}
              {skillSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {skillSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => addSkill(suggestion)}
                      className="w-full text-left p-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-white/60 text-sm">💡 Tip: Add ANY skill - technical, soft skills, languages, tools, etc. Custom entries welcome!</p>
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

        {/* Step 7: File Uploads (Optional) */}
        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">Upload your documents (Optional)</h2>
            <p className="text-white/70 mb-6">AI will analyze and provide personalized suggestions</p>
            
            {/* Resume Upload */}
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-3">📄 Resume</h3>
              <p className="text-white/70 text-sm mb-4">Upload your resume for personalized career guidance</p>
              
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'resume');
                }}
                className="hidden"
              />
              
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="w-full p-4 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
              >
                {uploadingResume ? 'Uploading...' : profile.uploadedResume ? '✓ Resume Uploaded' : 'Choose Resume (PDF or TXT)'}
              </button>
            </div>

            {/* Roadmap Upload */}
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-3">🗺️ Learning Roadmap</h3>
              <p className="text-white/70 text-sm mb-4">Have a roadmap? Upload it and AI will suggest improvements</p>
              
              <input
                ref={roadmapInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'roadmap');
                }}
                className="hidden"
              />
              
              <button
                onClick={() => roadmapInputRef.current?.click()}
                disabled={uploadingRoadmap}
                className="w-full p-4 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
              >
                {uploadingRoadmap ? 'Uploading...' : profile.uploadedRoadmap ? '✓ Roadmap Uploaded' : 'Choose Roadmap (PDF or TXT)'}
              </button>
            </div>

            <p className="text-white/60 text-sm text-center">You can skip this step and add documents later</p>
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
            {step === 7 ? 'Start Learning' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}








