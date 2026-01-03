'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import RoadmapView from './RoadmapView';
import StudyView from './StudyView';
import ProjectsView from './ProjectsView';
import JobsView from './JobsView';
import ResumeView from './ResumeView';

type View = 'roadmap' | 'study' | 'projects' | 'jobs' | 'resume';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('roadmap');
  const { userProfile, completedSteps, roadmap } = useApp();

  const progress = roadmap.length > 0 
    ? Math.round((completedSteps.length / roadmap.length) * 100)
    : 0;

  const navItems: { id: View; label: string; icon: string }[] = [
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { id: 'study', label: 'Study', icon: '📚' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'jobs', label: 'Jobs', icon: '💼' },
    { id: 'resume', label: 'Resume', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dream</h1>
              <p className="text-white/60 text-sm">
                {userProfile?.mainGoal || 'Career Development'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-white/60 text-xs">Overall Progress</div>
                <div className="text-white font-semibold text-lg">{progress}%</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <div className="text-white font-bold text-xl">
                  {userProfile?.mainGoal?.charAt(0) || 'D'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                  currentView === item.id
                    ? 'text-white border-b-2 border-purple-400'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'roadmap' && <RoadmapView />}
        {currentView === 'study' && <StudyView />}
        {currentView === 'projects' && <ProjectsView />}
        {currentView === 'jobs' && <JobsView />}
        {currentView === 'resume' && <ResumeView />}
      </main>
    </div>
  );
}

