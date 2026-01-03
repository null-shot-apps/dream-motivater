'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService, ProjectIdea } from '@/services/aiService';

export default function ProjectsView() {
  const { userProfile, completedSteps, roadmap, completedProjects, addCompletedProject } = useApp();
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectIdea | null>(null);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    if (userProfile && roadmap.length > 0) {
      // Get skills from completed steps
      const completedSkills = roadmap
        .filter(step => completedSteps.includes(step.id))
        .flatMap(step => step.skills);

      // Generate project ideas
      const ideas = aiService.generateProjectIdeas(
        completedSkills,
        userProfile.experienceLevel
      );
      setProjectIdeas(ideas);
    }
  }, [userProfile, roadmap, completedSteps]);

  const handleStartProject = (project: ProjectIdea) => {
    setSelectedProject(project);
    setShowCompleteForm(true);
  };

  const handleCompleteProject = () => {
    if (selectedProject && projectDescription) {
      addCompletedProject({
        title: selectedProject.title,
        description: projectDescription,
        skills: selectedProject.skills,
      });
      setShowCompleteForm(false);
      setSelectedProject(null);
      setProjectDescription('');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h2 className="text-white text-2xl font-bold mb-2">Build Real Projects</h2>
        <p className="text-white/70">
          Apply your skills with projects designed to boost your job readiness
        </p>
        <div className="mt-4 flex items-center gap-6">
          <div>
            <div className="text-white/60 text-sm">Completed Projects</div>
            <div className="text-white text-2xl font-bold">{completedProjects.length}</div>
          </div>
          <div>
            <div className="text-white/60 text-sm">Available Ideas</div>
            <div className="text-white text-2xl font-bold">{projectIdeas.length}</div>
          </div>
        </div>
      </div>

      {/* AI-Generated Project Ideas */}
      <div>
        <h3 className="text-white text-xl font-semibold mb-4">🤖 AI-Recommended Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectIdeas.map(project => (
            <div
              key={project.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-white font-semibold text-lg">{project.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${getDifficultyColor(project.difficulty)}`}>
                  {project.difficulty}
                </span>
              </div>
              <p className="text-white/70 text-sm mb-4">{project.description}</p>
              
              <div className="mb-4">
                <div className="text-white/60 text-xs mb-2">Skills You&apos;ll Use</div>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map(skill => (
                    <span
                      key={skill}
                      className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-white/60">
                    ⏱️ {project.estimatedHours}h
                  </div>
                  <div className="text-white/60">
                    💼 {project.jobRelevance}/10
                  </div>
                </div>
                <button
                  onClick={() => handleStartProject(project)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                >
                  Start Building
                </button>
              </div>
            </div>
          ))}
        </div>

        {projectIdeas.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <div className="text-white/60 text-lg mb-2">No project ideas yet</div>
            <p className="text-white/40 text-sm">
              Complete more roadmap steps to unlock project recommendations
            </p>
          </div>
        )}
      </div>

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <div>
          <h3 className="text-white text-xl font-semibold mb-4">✅ Your Completed Projects</h3>
          <div className="space-y-4">
            {completedProjects.map(project => (
              <div
                key={project.id}
                className="bg-green-500/10 backdrop-blur-lg rounded-xl p-6 border border-green-400/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-white font-semibold text-lg">{project.title}</h4>
                  <span className="text-green-400 text-sm">
                    {new Date(project.completedDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-white/70 text-sm mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map(skill => (
                    <span
                      key={skill}
                      className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Project Modal */}
      {showCompleteForm && selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-2xl w-full border border-white/20">
            <h3 className="text-white text-2xl font-bold mb-4">
              Complete: {selectedProject.title}
            </h3>
            <p className="text-white/70 mb-6">
              Tell us about what you built. This will be added to your resume!
            </p>
            
            <div className="mb-6">
              <label className="text-white text-sm font-semibold mb-2 block">
                Project Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe what you built, challenges you solved, and technologies you used..."
                className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCompleteForm(false);
                  setSelectedProject(null);
                  setProjectDescription('');
                }}
                className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteProject}
                disabled={!projectDescription.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





