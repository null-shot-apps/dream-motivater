'use client';

import { useState } from 'react';
import { UserProfile, aiService } from '@/services/aiService';
import { extractTextFromFile, formatFileSize } from '@/utils/fileUtils';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

// Suggested goals and skills for autocomplete
const SUGGESTED_GOALS = [
  'Data Analyst', 'Data Scientist', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Mobile Developer', 'DevOps Engineer', 'UI/UX Designer',
  'Machine Learning Engineer', 'Cloud Architect', 'Cybersecurity Specialist',
  'Game Developer', 'Blockchain Developer', 'Product Manager',
];

const SUGGESTED_SECONDARY = [
  'Customer Service', 'Age Care Worker', 'Support Worker', 'Retail',
  'Hospitality', 'Teaching', 'Healthcare', 'Sales', 'Marketing',
  'UI/UX Design', 'Cloud Architecture', 'Machine Learning', 'Cybersecurity',
  'Blockchain', 'Game Development', 'Technical Writing',
];

const SUGGESTED_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'React', 'Angular', 'Vue',
  'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'SQL', 'MongoDB',
  'PostgreSQL', 'MySQL', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'REST API', 'GraphQL', 'Testing',
  'Jest', 'Cypress', 'Excel', 'Tableau', 'Power BI', 'Pandas', 'NumPy',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Statistics', 'Data Visualization',
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    primaryGoals: [],
    secondaryGoals: [],
    skills: [],
  });

  // Search states
  const [primaryGoalSearch, setPrimaryGoalSearch] = useState('');
  const [secondaryGoalSearch, setSecondaryGoalSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  // File upload states
  const [uploadingRoadmap, setUploadingRoadmap] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [roadmapAnalysis, setRoadmapAnalysis] = useState<any>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const addPrimaryGoal = (goal: string) => {
    const trimmed = goal.trim();
    if (trimmed && !profile.primaryGoals?.includes(trimmed)) {
      updateProfile('primaryGoals', [...(profile.primaryGoals || []), trimmed]);
      setPrimaryGoalSearch('');
    }
  };

  const removePrimaryGoal = (goal: string) => {
    updateProfile('primaryGoals', profile.primaryGoals?.filter(g => g !== goal) || []);
  };

  const addSecondaryGoal = (goal: string) => {
    const trimmed = goal.trim();
    if (trimmed && !profile.secondaryGoals?.includes(trimmed)) {
      updateProfile('secondaryGoals', [...(profile.secondaryGoals || []), trimmed]);
      setSecondaryGoalSearch('');
    }
  };

  const removeSecondaryGoal = (goal: string) => {
    updateProfile('secondaryGoals', profile.secondaryGoals?.filter(g => g !== goal) || []);
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !profile.skills?.includes(trimmed)) {
      updateProfile('skills', [...(profile.skills || []), trimmed]);
      setSkillSearch('');
    }
  };

  const removeSkill = (skill: string) => {
    updateProfile('skills', profile.skills?.filter(s => s !== skill) || []);
  };

  const handleRoadmapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRoadmap(true);
    try {
      const text = await extractTextFromFile(file);
      const analysis = await aiService.analyzeRoadmap(text, profile.primaryGoals || []);
      
      updateProfile('uploadedRoadmap', {
        filename: file.name,
        content: text,
        aiAnalysis: JSON.stringify(analysis),
      });
      
      setRoadmapAnalysis(analysis);
    } catch (error: any) {
      alert(error.message || 'Failed to process roadmap');
    } finally {
      setUploadingRoadmap(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const text = await extractTextFromFile(file);
      const analysis = await aiService.analyzeResume(text);
      
      updateProfile('uploadedResume', {
        filename: file.name,
        content: text,
        extractedSkills: analysis.extractedSkills,
      });
      
      // Auto-add extracted skills
      const newSkills = analysis.extractedSkills.filter(
        skill => !profile.skills?.includes(skill)
      );
      if (newSkills.length > 0) {
        updateProfile('skills', [...(profile.skills || []), ...newSkills]);
      }
      
      setResumeAnalysis(analysis);
    } catch (error: any) {
      alert(error.message || 'Failed to process resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleNext = () => {
    if (step < 7) {
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
      case 1: return (profile.primaryGoals?.length || 0) > 0;
      case 2: return true; // Secondary goals optional
      case 3: return (profile.skills?.length || 0) > 0;
      case 4: return !!profile.experienceLevel;
      case 5: return !!profile.weeklyHours;
      case 6: return !!profile.learningStyle;
      case 7: return true; // File uploads optional
      default: return false;
    }
  };

  const filteredPrimaryGoals = SUGGESTED_GOALS.filter(goal =>
    goal.toLowerCase().includes(primaryGoalSearch.toLowerCase())
  );

  const filteredSecondaryGoals = SUGGESTED_SECONDARY.filter(goal =>
    goal.toLowerCase().includes(secondaryGoalSearch.toLowerCase())
  );

  const filteredSkills = SUGGESTED_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

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
            <p className="text-white/70 mb-6">Add one or more main goals you&apos;re working towards</p>
            
            {/* Selected goals */}
            {profile.primaryGoals && profile.primaryGoals.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.primaryGoals.map(goal => (
                  <div
                    key={goal}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    <span>{goal}</span>
                    <button
                      onClick={() => removePrimaryGoal(goal)}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={primaryGoalSearch}
                onChange={(e) => setPrimaryGoalSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && primaryGoalSearch.trim()) {
                    addPrimaryGoal(primaryGoalSearch);
                  }
                }}
                placeholder="Search or type your goal..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {primaryGoalSearch && (
                <button
                  onClick={() => addPrimaryGoal(primaryGoalSearch)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-1 rounded-lg text-sm"
                >
                  Add
                </button>
              )}
            </div>

            {/* Suggestions */}
            {primaryGoalSearch && filteredPrimaryGoals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {filteredPrimaryGoals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => addPrimaryGoal(goal)}
                    className="p-3 rounded-xl text-left bg-white/10 text-white/80 hover:bg-white/20 transition-all"
                  >
                    {goal}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Secondary Goals (Searchable, Multiple) */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">Any secondary goals or interests?</h2>
            <p className="text-white/70 mb-6">Part-time work, side interests, or complementary skills (optional)</p>
            
            {/* Selected goals */}
            {profile.secondaryGoals && profile.secondaryGoals.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.secondaryGoals.map(goal => (
                  <div
                    key={goal}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    <span>{goal}</span>
                    <button
                      onClick={() => removeSecondaryGoal(goal)}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={secondaryGoalSearch}
                onChange={(e) => setSecondaryGoalSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && secondaryGoalSearch.trim()) {
                    addSecondaryGoal(secondaryGoalSearch);
                  }
                }}
                placeholder="Search or type secondary goals..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {secondaryGoalSearch && (
                <button
                  onClick={() => addSecondaryGoal(secondaryGoalSearch)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-lg text-sm"
                >
                  Add
                </button>
              )}
            </div>

            {/* Suggestions */}
            {secondaryGoalSearch && filteredSecondaryGoals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {filteredSecondaryGoals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => addSecondaryGoal(goal)}
                    className="p-3 rounded-xl text-left bg-white/10 text-white/80 hover:bg-white/20 transition-all"
                  >
                    {goal}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Skills (Searchable, Multiple) */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">What skills do you already have?</h2>
            <p className="text-white/70 mb-6">Add your current skills - we&apos;ll personalize your learning path</p>
            
            {/* Selected skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto">
                {profile.skills.map(skill => (
                  <div
                    key={skill}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && skillSearch.trim()) {
                    addSkill(skillSearch);
                  }
                }}
                placeholder="Search or type your skills..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {skillSearch && (
                <button
                  onClick={() => addSkill(skillSearch)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded-lg text-sm"
                >
                  Add
                </button>
              )}
            </div>

            {/* Suggestions */}
            {skillSearch && filteredSkills.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredSkills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => addSkill(skill)}
                    className="p-2 rounded-lg text-left bg-white/10 text-white/80 hover:bg-white/20 transition-all text-sm"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Experience Level */}
        {step === 4 && (
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

        {/* Step 5: Weekly Hours */}
        {step === 5 && (
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

        {/* Step 6: Learning Style */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-2">How do you learn best?</h2>
            <p className="text-white/70 mb-6">We&apos;ll recommend resources that match your style</p>
            <div className="space-y-4">
              {[
                { value: 'visual', label: 'Visual Learner', desc: 'Videos, diagrams, and visual content' },
                { value: 'hands-on', label: 'Hands-on Learner', desc: 'Practice, coding, and building projects' },
                { value: 'reading', label: 'Reading Learner', desc: 'Articles, documentation, and books' },
                { value: 'mixed', label: 'Mixed Approach', desc: 'Combination of all learning styles' },
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
            <p className="text-white/70 mb-6">Upload your resume or existing roadmap for AI analysis</p>
            
            {/* Resume Upload */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-3">📄 Resume</h3>
              <p className="text-white/60 text-sm mb-4">
                Upload your resume to extract skills and get improvement suggestions
              </p>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className={`block w-full p-4 border-2 border-dashed border-white/30 rounded-lg text-center cursor-pointer hover:border-white/50 transition-all ${
                  uploadingResume ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingResume ? (
                  <span className="text-white/70">Analyzing resume...</span>
                ) : profile.uploadedResume ? (
                  <span className="text-green-400">✓ {profile.uploadedResume.filename}</span>
                ) : (
                  <span className="text-white/70">Click to upload PDF or TXT</span>
                )}
              </label>
              
              {resumeAnalysis && (
                <div className="mt-4 p-4 bg-green-500/20 rounded-lg">
                  <p className="text-green-300 text-sm font-semibold mb-2">✓ Analysis Complete</p>
                  <p className="text-white/80 text-sm">
                    Extracted {resumeAnalysis.extractedSkills?.length || 0} skills
                  </p>
                  {resumeAnalysis.suggestions && resumeAnalysis.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-white/70 text-xs">Suggestions:</p>
                      <ul className="text-white/60 text-xs list-disc list-inside">
                        {resumeAnalysis.suggestions.slice(0, 2).map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Roadmap Upload */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-3">🗺️ Learning Roadmap</h3>
              <p className="text-white/60 text-sm mb-4">
                Upload your existing roadmap to get AI suggestions for improvement
              </p>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleRoadmapUpload}
                disabled={uploadingRoadmap}
                className="hidden"
                id="roadmap-upload"
              />
              <label
                htmlFor="roadmap-upload"
                className={`block w-full p-4 border-2 border-dashed border-white/30 rounded-lg text-center cursor-pointer hover:border-white/50 transition-all ${
                  uploadingRoadmap ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingRoadmap ? (
                  <span className="text-white/70">Analyzing roadmap...</span>
                ) : profile.uploadedRoadmap ? (
                  <span className="text-blue-400">✓ {profile.uploadedRoadmap.filename}</span>
                ) : (
                  <span className="text-white/70">Click to upload PDF or TXT</span>
                )}
              </label>
              
              {roadmapAnalysis && (
                <div className="mt-4 p-4 bg-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-sm font-semibold mb-2">✓ Analysis Complete</p>
                  <p className="text-white/80 text-sm mb-2">{roadmapAnalysis.analysis}</p>
                  {roadmapAnalysis.estimatedTime && (
                    <p className="text-white/60 text-xs">
                      Estimated time: {roadmapAnalysis.estimatedTime}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {step === 7 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

