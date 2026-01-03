'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService, AISuggestion } from '@/services/aiService';

export default function RoadmapView() {
  const { userProfile, roadmap, completedSteps, setRoadmap, completeStep, updateRoadmap } = useApp();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Generate roadmap if not exists
    if (userProfile && roadmap.length === 0) {
      const generatedRoadmap = aiService.generateRoadmap(userProfile);
      setRoadmap(generatedRoadmap);
    }
  }, [userProfile, roadmap.length, setRoadmap]);

  useEffect(() => {
    // Generate AI suggestions
    if (userProfile && roadmap.length > 0) {
      const aiSuggestions = aiService.generateRoadmapSuggestions(
        roadmap,
        userProfile,
        completedSteps
      );
      setSuggestions(aiSuggestions);
    }
  }, [userProfile, roadmap, completedSteps]);

  const handleAcceptSuggestion = (suggestion: AISuggestion) => {
    if (suggestion.type === 'add') {
      const newSteps = [...roadmap, ...suggestion.data];
      updateRoadmap(newSteps);
    } else if (suggestion.type === 'remove' && suggestion.stepId) {
      const filtered = roadmap.filter(s => s.id !== suggestion.stepId);
      updateRoadmap(filtered);
    } else if (suggestion.type === 'reorder') {
      const sorted = [...roadmap].sort((a, b) => 
        a.estimatedHours - b.estimatedHours
      );
      updateRoadmap(sorted);
    }
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const totalHours = roadmap.reduce((sum, step) => sum + step.estimatedHours, 0);
  const completedHours = roadmap
    .filter(step => completedSteps.includes(step.id))
    .reduce((sum, step) => sum + step.estimatedHours, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-white/60 text-sm mb-1">Total Steps</div>
          <div className="text-white text-3xl font-bold">{roadmap.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-white/60 text-sm mb-1">Completed</div>
          <div className="text-white text-3xl font-bold">{completedSteps.length}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-white/60 text-sm mb-1">Hours Remaining</div>
          <div className="text-white text-3xl font-bold">{totalHours - completedHours}h</div>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h3 className="text-white font-semibold text-lg">AI Suggestions</h3>
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {suggestions.length}
              </span>
            </div>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-white/60 hover:text-white text-sm"
            >
              {showSuggestions ? 'Hide' : 'Show'}
            </button>
          </div>

          {showSuggestions && (
            <div className="space-y-3">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="bg-black/30 rounded-lg p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-purple-300 uppercase">
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-white/60">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-white text-sm">{suggestion.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectSuggestion(suggestion.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-sm rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roadmap Steps */}
      <div className="space-y-4">
        <h2 className="text-white text-2xl font-bold">Your Learning Path</h2>
        {roadmap.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isNext = !isCompleted && completedSteps.length === index;

          return (
            <div
              key={step.id}
              className={`bg-white/10 backdrop-blur-lg rounded-xl p-6 border transition-all ${
                isCompleted
                  ? 'border-green-400/50 bg-green-500/10'
                  : isNext
                  ? 'border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                  : 'border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isNext
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <h3 className="text-white text-xl font-semibold">{step.title}</h3>
                    {isNext && (
                      <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 mb-4 ml-11">{step.description}</p>
                  <div className="flex flex-wrap gap-2 ml-11">
                    {step.skills.map(skill => (
                      <span
                        key={skill}
                        className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/60 text-sm mb-2">{step.estimatedHours}h</div>
                  {!isCompleted && (
                    <button
                      onClick={() => completeStep(step.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {roadmap.length === 0 && (
        <div className="text-center py-12">
          <div className="text-white/60 text-lg">
            Complete onboarding to generate your personalized roadmap
          </div>
        </div>
      )}
    </div>
  );
}

