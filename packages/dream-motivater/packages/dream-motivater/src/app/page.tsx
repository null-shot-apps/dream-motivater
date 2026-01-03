'use client';

import { useState, useEffect } from 'react';
import { 
  Target, 
  BookOpen, 
  Code, 
  Briefcase, 
  FileText, 
  TrendingUp,
  Search,
  Upload,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';
import { aiService, UserProfile, RoadmapStep, Project, Job } from '@/lib/aiService';

type View = 'welcome' | 'onboarding' | 'dashboard' | 'roadmap' | 'study' | 'projects' | 'jobs' | 'resume';
type OnboardingStep = 'goals' | 'experience' | 'time' | 'skills' | 'learning' | 'upload';

export default function Home() {
  const [view, setView] = useState<View>('welcome');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('goals');
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    primaryGoals: [],
    secondaryGoals: [],
    existingSkills: [],
    experienceLevel: 'beginner',
    weeklyHours: 10,
    learningStyle: 'mixed'
  });
  
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search states
  const [goalSearch, setGoalSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  // PDF upload
  const [uploadedPDF, setUploadedPDF] = useState<string | null>(null);
  const [pdfAnalysis, setPdfAnalysis] = useState<any>(null);

  // Common goals and skills for suggestions
  const commonGoals = [
    'Data Analyst', 'Data Scientist', 'Web Developer', 'Frontend Developer',
    'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
    'DevOps Engineer', 'Machine Learning Engineer', 'UI/UX Designer',
    'Product Manager', 'Project Manager', 'Business Analyst',
    'Customer Service Representative', 'Aged Care Worker', 'Healthcare Assistant',
    'Digital Marketing Specialist', 'Content Writer', 'Graphic Designer',
    'Cybersecurity Analyst', 'Cloud Engineer', 'QA Engineer'
  ];

  const commonSkills = [
    'Python', 'JavaScript', 'Java', 'C++', 'SQL', 'HTML', 'CSS', 'React',
    'Node.js', 'Angular', 'Vue.js', 'TypeScript', 'Git', 'Docker', 'Kubernetes',
    'AWS', 'Azure', 'Machine Learning', 'Data Analysis', 'Statistics',
    'Excel', 'Tableau', 'Power BI', 'Figma', 'Photoshop', 'Communication',
    'Problem Solving', 'Leadership', 'Project Management', 'Agile', 'Scrum',
    'First Aid', 'Patient Care', 'CRM Software', 'SEO', 'Content Writing'
  ];

  // Filter suggestions based on search
  const filteredGoals = commonGoals.filter(g => 
    g.toLowerCase().includes(goalSearch.toLowerCase())
  );

  const filteredSkills = commonSkills.filter(s => 
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('dreamAppData');
    if (saved) {
      const data = JSON.parse(saved);
      setProfile(data.profile || {});
      setRoadmap(data.roadmap || []);
      setProjects(data.projects || []);
      setJobs(data.jobs || []);
      if (data.profile && data.roadmap.length > 0) {
        setView('dashboard');
      }
    }
  }, []);

  // Save data
  const saveData = () => {
    localStorage.setItem('dreamAppData', JSON.stringify({
      profile,
      roadmap,
      projects,
      jobs
    }));
  };

  // Handle goal selection
  const toggleGoal = (goal: string, type: 'primary' | 'secondary') => {
    const key = type === 'primary' ? 'primaryGoals' : 'secondaryGoals';
    const current = profile[key] || [];
    
    if (current.includes(goal)) {
      setProfile({ ...profile, [key]: current.filter(g => g !== goal) });
    } else {
      setProfile({ ...profile, [key]: [...current, goal] });
    }
  };

  // Handle skill selection
  const toggleSkill = (skill: string) => {
    const current = profile.existingSkills || [];
    
    if (current.includes(skill)) {
      setProfile({ ...profile, existingSkills: current.filter(s => s !== skill) });
    } else {
      setProfile({ ...profile, existingSkills: [...current, skill] });
    }
  };

  // Add custom goal/skill
  const addCustomGoal = (type: 'primary' | 'secondary') => {
    if (goalSearch.trim()) {
      toggleGoal(goalSearch.trim(), type);
      setGoalSearch('');
    }
  };

  const addCustomSkill = () => {
    if (skillSearch.trim()) {
      toggleSkill(skillSearch.trim());
      setSkillSearch('');
    }
  };

  // Handle PDF upload
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      setUploadedPDF(text);
      
      // Analyze PDF
      const analysis = await aiService.analyzePDFRoadmap(text, profile as UserProfile);
      setPdfAnalysis(analysis);
    } catch (error) {
      console.error('PDF upload error:', error);
      alert('Error processing PDF. Please try again.');
    }
    setLoading(false);
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Generate AI-driven roadmap
      const generatedRoadmap = await aiService.generateRoadmap(profile as UserProfile);
      
      // If PDF was uploaded, merge with improved roadmap
      if (pdfAnalysis?.improvedRoadmap) {
        setRoadmap([...pdfAnalysis.improvedRoadmap, ...generatedRoadmap]);
      } else {
        setRoadmap(generatedRoadmap);
      }
      
      // Generate initial projects
      const initialProjects = await aiService.generateProjects(profile as UserProfile, []);
      setProjects(initialProjects);
      
      // Generate job matches
      const matchedJobs = await aiService.matchJobs(profile as UserProfile, [], []);
      setJobs(matchedJobs);
      
      saveData();
      setView('dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Error generating your plan. Please try again.');
    }
    setLoading(false);
  };

  // Onboarding navigation
  const nextOnboardingStep = () => {
    const steps: OnboardingStep[] = ['goals', 'experience', 'time', 'skills', 'learning', 'upload'];
    const currentIndex = steps.indexOf(onboardingStep);
    if (currentIndex < steps.length - 1) {
      setOnboardingStep(steps[currentIndex + 1]);
    } else {
      completeOnboarding();
    }
  };

  const prevOnboardingStep = () => {
    const steps: OnboardingStep[] = ['goals', 'experience', 'time', 'skills', 'learning', 'upload'];
    const currentIndex = steps.indexOf(onboardingStep);
    if (currentIndex > 0) {
      setOnboardingStep(steps[currentIndex - 1]);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    if (roadmap.length === 0) return 0;
    const completed = roadmap.filter(step => step.completed).length;
    return Math.round((completed / roadmap.length) * 100);
  };

  // Welcome View
  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="mb-6">
            <Sparkles className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Dream Career Builder
            </h1>
            <p className="text-xl text-gray-600">
              Your AI-powered path to career success
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 my-8">
            <div className="bg-purple-50 p-6 rounded-xl">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Personalized Roadmaps</h3>
              <p className="text-sm text-gray-600">AI-generated learning paths tailored to your goals</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl">
              <Code className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Smart Projects</h3>
              <p className="text-sm text-gray-600">Progressive challenges that build real skills</p>
            </div>
            <div className="bg-cyan-50 p-6 rounded-xl">
              <Briefcase className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Job Matching</h3>
              <p className="text-sm text-gray-600">Find opportunities that match your readiness</p>
            </div>
            <div className="bg-green-50 p-6 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Adaptive Learning</h3>
              <p className="text-sm text-gray-600">Content that adjusts to your progress</p>
            </div>
          </div>

          <button
            onClick={() => setView('onboarding')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            Start Your Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Onboarding View
  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="bg-white rounded-full h-2 mb-8">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(['goals', 'experience', 'time', 'skills', 'learning', 'upload'].indexOf(onboardingStep) + 1) / 6 * 100}%` }}
            />
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            {/* Goals Step */}
            {onboardingStep === 'goals' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What are your career goals?</h2>
                <p className="text-gray-600 mb-6">Select multiple primary and secondary goals</p>

                {/* Primary Goals */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Goals (Main Career)</h3>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={goalSearch}
                      onChange={(e) => {
                        setGoalSearch(e.target.value);
                        setShowGoalSuggestions(true);
                      }}
                      onFocus={() => setShowGoalSuggestions(true)}
                      placeholder="Search or type your own goal..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    {goalSearch && (
                      <button
                        onClick={() => addCustomGoal('primary')}
                        className="absolute right-2 top-2 bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700"
                      >
                        Add
                      </button>
                    )}
                  </div>

                  {/* Suggestions */}
                  {showGoalSuggestions && goalSearch && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
                      {filteredGoals.slice(0, 8).map(goal => (
                        <button
                          key={goal}
                          onClick={() => {
                            toggleGoal(goal, 'primary');
                            setGoalSearch('');
                            setShowGoalSuggestions(false);
                          }}
                          className="block w-full text-left px-3 py-2 hover:bg-white rounded-lg text-sm"
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected primary goals */}
                  <div className="flex flex-wrap gap-2">
                    {profile.primaryGoals?.map(goal => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal, 'primary')}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
                      >
                        {goal}
                        <span className="text-lg">×</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Goals */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Secondary Goals (Part-time/Side)</h3>
                  <p className="text-sm text-gray-500 mb-3">e.g., Part-time job in customer service while studying data science</p>
                  
                  {/* Selected secondary goals */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.secondaryGoals?.map(goal => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal, 'secondary')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                      >
                        {goal}
                        <span className="text-lg">×</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setShowGoalSuggestions(true);
                      setGoalSearch('');
                    }}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    + Add secondary goal
                  </button>

                  {showGoalSuggestions && !goalSearch && (
                    <div className="bg-gray-50 rounded-xl p-3 mt-2 max-h-40 overflow-y-auto">
                      {commonGoals.slice(0, 10).map(goal => (
                        <button
                          key={goal}
                          onClick={() => {
                            toggleGoal(goal, 'secondary');
                            setShowGoalSuggestions(false);
                          }}
                          className="block w-full text-left px-3 py-2 hover:bg-white rounded-lg text-sm"
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Experience Step */}
            {onboardingStep === 'experience' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your experience level?</h2>
                <p className="text-gray-600 mb-6">This helps us tailor the content difficulty</p>

                <div className="space-y-3">
                  {[
                    { value: 'beginner', label: 'Beginner', desc: 'Just starting out, little to no experience' },
                    { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, looking to level up' },
                    { value: 'advanced', label: 'Advanced', desc: 'Experienced, seeking specialization' }
                  ].map(level => (
                    <button
                      key={level.value}
                      onClick={() => setProfile({ ...profile, experienceLevel: level.value as any })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        profile.experienceLevel === level.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Step */}
            {onboardingStep === 'time' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">How much time can you commit?</h2>
                <p className="text-gray-600 mb-6">Weekly hours for learning and practice</p>

                <div className="mb-6">
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={profile.weeklyHours}
                    onChange={(e) => setProfile({ ...profile, weeklyHours: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center mt-4">
                    <div className="text-4xl font-bold text-purple-600">{profile.weeklyHours}</div>
                    <div className="text-gray-600">hours per week</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[5, 10, 20, 30].map(hours => (
                    <button
                      key={hours}
                      onClick={() => setProfile({ ...profile, weeklyHours: hours })}
                      className={`p-4 rounded-xl border-2 ${
                        profile.weeklyHours === hours
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900">{hours}h</div>
                      <div className="text-sm text-gray-600">per week</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Step */}
            {onboardingStep === 'skills' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What skills do you already have?</h2>
                <p className="text-gray-600 mb-6">Select all that apply or add your own</p>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => {
                      setSkillSearch(e.target.value);
                      setShowSkillSuggestions(true);
                    }}
                    onFocus={() => setShowSkillSuggestions(true)}
                    placeholder="Search or type your own skill..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                  {skillSearch && (
                    <button
                      onClick={addCustomSkill}
                      className="absolute right-2 top-2 bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700"
                    >
                      Add
                    </button>
                  )}
                </div>

                {/* Suggestions */}
                {showSkillSuggestions && skillSearch && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-60 overflow-y-auto">
                    {filteredSkills.slice(0, 15).map(skill => (
                      <button
                        key={skill}
                        onClick={() => {
                          toggleSkill(skill);
                          setSkillSearch('');
                          setShowSkillSuggestions(false);
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-white rounded-lg text-sm"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected skills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.existingSkills?.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
                    >
                      {skill}
                      <span className="text-lg">×</span>
                    </button>
                  ))}
                </div>

                {profile.existingSkills?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No skills selected yet. Search above or click below to browse.</p>
                  </div>
                )}

                <button
                  onClick={() => setShowSkillSuggestions(!showSkillSuggestions)}
                  className="text-purple-600 text-sm hover:underline"
                >
                  {showSkillSuggestions ? 'Hide suggestions' : 'Browse common skills'}
                </button>

                {showSkillSuggestions && !skillSearch && (
                  <div className="bg-gray-50 rounded-xl p-3 mt-2 max-h-60 overflow-y-auto grid grid-cols-2 gap-2">
                    {commonSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-2 rounded-lg text-sm text-left ${
                          profile.existingSkills?.includes(skill)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Learning Style Step */}
            {onboardingStep === 'learning' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">How do you learn best?</h2>
                <p className="text-gray-600 mb-6">We'll prioritize resources that match your style</p>

                <div className="space-y-3">
                  {[
                    { value: 'visual', label: 'Visual', desc: 'Videos, diagrams, and demonstrations', icon: '🎥' },
                    { value: 'hands-on', label: 'Hands-on', desc: 'Practice exercises and projects', icon: '💻' },
                    { value: 'reading', label: 'Reading', desc: 'Articles, books, and documentation', icon: '📚' },
                    { value: 'mixed', label: 'Mixed', desc: 'Combination of all styles', icon: '🎯' }
                  ].map(style => (
                    <button
                      key={style.value}
                      onClick={() => setProfile({ ...profile, learningStyle: style.value as any })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        profile.learningStyle === style.value
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{style.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{style.label}</div>
                          <div className="text-sm text-gray-600">{style.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Step */}
            {onboardingStep === 'upload' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Have an existing roadmap?</h2>
                <p className="text-gray-600 mb-6">Upload a PDF and our AI will analyze and improve it (optional)</p>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 inline-block">
                      Choose PDF File
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handlePDFUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
                </div>

                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-gray-600">Analyzing your roadmap...</p>
                  </div>
                )}

                {pdfAnalysis && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Analysis Complete
                    </h3>
                    <p className="text-green-800 mb-4">{pdfAnalysis.analysis}</p>
                    
                    {pdfAnalysis.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-900 mb-2">AI Suggestions:</h4>
                        <ul className="space-y-1">
                          {pdfAnalysis.suggestions.map((sug: string, i: number) => (
                            <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              {sug}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setOnboardingStep('upload');
                    completeOnboarding();
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300"
                >
                  Skip - Generate Fresh Roadmap
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              {onboardingStep !== 'goals' && (
                <button
                  onClick={prevOnboardingStep}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300"
                >
                  Back
                </button>
              )}
              <button
                onClick={nextOnboardingStep}
                disabled={loading || (onboardingStep === 'goals' && (!profile.primaryGoals?.length))}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {onboardingStep === 'upload' ? 'Generate My Plan' : 'Continue'}
                {loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (view === 'dashboard') {
    const progress = calculateProgress();
    const completedSteps = roadmap.filter(s => s.completed).length;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-purple-100">
              Working towards: {profile.primaryGoals?.join(', ')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-7xl mx-auto px-6 -mt-8">
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Progress</span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{progress}%</div>
              <div className="text-sm text-gray-500">{completedSteps}/{roadmap.length} steps</div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Projects</span>
                <Code className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{projects.length}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Job Matches</span>
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{jobs.length}</div>
              <div className="text-sm text-gray-500">Found</div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Study Time</span>
                <Clock className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{profile.weeklyHours}h</div>
              <div className="text-sm text-gray-500">Per week</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setView('roadmap')}
              className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all text-left"
            >
              <Target className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">My Roadmap</h3>
              <p className="text-sm text-gray-600">View learning path</p>
            </button>

            <button
              onClick={() => setView('study')}
              className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all text-left"
            >
              <BookOpen className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Study & Practice</h3>
              <p className="text-sm text-gray-600">Adaptive learning</p>
            </button>

            <button
              onClick={() => setView('projects')}
              className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all text-left"
            >
              <Code className="w-8 h-8 text-cyan-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Projects</h3>
              <p className="text-sm text-gray-600">Build your portfolio</p>
            </button>

            <button
              onClick={() => setView('jobs')}
              className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-all text-left"
            >
              <Briefcase className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Job Matches</h3>
              <p className="text-sm text-gray-600">Find opportunities</p>
            </button>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h2>
            <div className="space-y-3">
              {roadmap.filter(s => !s.completed).slice(0, 3).map(step => (
                <div key={step.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-semibold">{step.order + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.duration}</p>
                  </div>
                  <button
                    onClick={() => setView('roadmap')}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simple placeholder for other views
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setView('dashboard')}
          className="mb-6 text-purple-600 hover:underline flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {view === 'roadmap' && 'My Learning Roadmap'}
          {view === 'study' && 'Study & Practice'}
          {view === 'projects' && 'Projects'}
          {view === 'jobs' && 'Job Matches'}
          {view === 'resume' && 'My Resume'}
        </h1>
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600">This section is being built with AI-powered features...</p>
        </div>
      </div>
    </div>
  );
}

