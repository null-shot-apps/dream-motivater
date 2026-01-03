'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, RoadmapStep, ResumeSection } from '@/services/aiService';

interface AppState {
  // User data
  userProfile: UserProfile | null;
  isOnboarded: boolean;
  
  // Roadmap
  roadmap: RoadmapStep[];
  completedSteps: string[];
  
  // Learning
  currentSkill: string | null;
  practiceStats: Record<string, {
    questionsAnswered: number;
    correctAnswers: number;
    timeSpent: number;
  }>;
  
  // Projects
  completedProjects: Array<{
    id: string;
    title: string;
    description: string;
    skills: string[];
    completedDate: string;
  }>;
  
  // Jobs
  savedJobs: string[];
  
  // Resume
  resume: ResumeSection | null;
}

interface AppContextType extends AppState {
  // User actions
  setUserProfile: (profile: UserProfile) => void;
  completeOnboarding: () => void;
  
  // Roadmap actions
  setRoadmap: (roadmap: RoadmapStep[]) => void;
  completeStep: (stepId: string) => void;
  updateRoadmap: (roadmap: RoadmapStep[]) => void;
  
  // Learning actions
  setCurrentSkill: (skill: string) => void;
  updatePracticeStats: (skill: string, correct: boolean, timeSpent: number) => void;
  
  // Project actions
  addCompletedProject: (project: {
    title: string;
    description: string;
    skills: string[];
  }) => void;
  
  // Job actions
  toggleSaveJob: (jobId: string) => void;
  
  // Resume actions
  updateResume: (resume: ResumeSection) => void;
  
  // Utility
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'dream-app-state';

const initialState: AppState = {
  userProfile: null,
  isOnboarded: false,
  roadmap: [],
  completedSteps: [],
  currentSkill: null,
  practiceStats: {},
  completedProjects: [],
  savedJobs: [],
  resume: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored state:', e);
      }
    }
  }, []);

  // Persist state to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const contextValue: AppContextType = {
    ...state,

    setUserProfile: (profile) => {
      setState(prev => ({ ...prev, userProfile: profile }));
    },

    completeOnboarding: () => {
      setState(prev => ({ ...prev, isOnboarded: true }));
    },

    setRoadmap: (roadmap) => {
      setState(prev => ({ ...prev, roadmap }));
    },

    completeStep: (stepId) => {
      setState(prev => ({
        ...prev,
        completedSteps: [...prev.completedSteps, stepId],
        roadmap: prev.roadmap.map(step =>
          step.id === stepId ? { ...step, completed: true } : step
        ),
      }));
    },

    updateRoadmap: (roadmap) => {
      setState(prev => ({ ...prev, roadmap }));
    },

    setCurrentSkill: (skill) => {
      setState(prev => ({ ...prev, currentSkill: skill }));
    },

    updatePracticeStats: (skill, correct, timeSpent) => {
      setState(prev => {
        const current = prev.practiceStats[skill] || {
          questionsAnswered: 0,
          correctAnswers: 0,
          timeSpent: 0,
        };

        return {
          ...prev,
          practiceStats: {
            ...prev.practiceStats,
            [skill]: {
              questionsAnswered: current.questionsAnswered + 1,
              correctAnswers: current.correctAnswers + (correct ? 1 : 0),
              timeSpent: current.timeSpent + timeSpent,
            },
          },
        };
      });
    },

    addCompletedProject: (project) => {
      setState(prev => ({
        ...prev,
        completedProjects: [
          ...prev.completedProjects,
          {
            ...project,
            id: `proj-${Date.now()}`,
            completedDate: new Date().toISOString(),
          },
        ],
      }));
    },

    toggleSaveJob: (jobId) => {
      setState(prev => ({
        ...prev,
        savedJobs: prev.savedJobs.includes(jobId)
          ? prev.savedJobs.filter(id => id !== jobId)
          : [...prev.savedJobs, jobId],
      }));
    },

    updateResume: (resume) => {
      setState(prev => ({ ...prev, resume }));
    },

    resetApp: () => {
      setState(initialState);
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}


