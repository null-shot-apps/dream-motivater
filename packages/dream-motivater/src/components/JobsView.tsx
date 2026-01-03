'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService, JobMatch } from '@/services/aiService';

export default function JobsView() {
  const { userProfile, completedSteps, roadmap, completedProjects, savedJobs, toggleSaveJob } = useApp();
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  useEffect(() => {
    if (userProfile && roadmap.length > 0) {
      // Get skills from completed steps
      const userSkills = roadmap
        .filter(step => completedSteps.includes(step.id))
        .flatMap(step => step.skills);

      // Match jobs using AI
      const matches = aiService.matchJobs(
        userSkills,
        completedProjects.length,
        userProfile.experienceLevel
      );
      setJobMatches(matches);
    }
  }, [userProfile, roadmap, completedSteps, completedProjects]);

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getReadinessColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h2 className="text-white text-2xl font-bold mb-2">Job Matches</h2>
        <p className="text-white/70">
          AI-powered job matching based on your skills and experience
        </p>
        <div className="mt-4 flex items-center gap-6">
          <div>
            <div className="text-white/60 text-sm">Available Jobs</div>
            <div className="text-white text-2xl font-bold">{jobMatches.length}</div>
          </div>
          <div>
            <div className="text-white/60 text-sm">Saved Jobs</div>
            <div className="text-white text-2xl font-bold">{savedJobs.length}</div>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {jobMatches.map(job => {
          const isSaved = savedJobs.includes(job.id);

          return (
            <div
              key={job.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white text-xl font-semibold mb-1">{job.title}</h3>
                  <p className="text-white/60">{job.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveJob(job.id);
                    }}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {isSaved ? '⭐' : '☆'}
                  </button>
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${getMatchColor(job.matchScore)}`}>
                    {job.matchScore}% Match
                  </span>
                </div>
              </div>

              {/* Readiness Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/60">Job Readiness</span>
                  <span className="text-white font-semibold">{job.readinessLevel}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getReadinessColor(job.readinessLevel)}`}
                    style={{ width: `${job.readinessLevel}%` }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-white/60 text-xs mb-2">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.slice(0, 4).map(skill => (
                      <span
                        key={skill}
                        className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="text-white/60 text-xs px-2 py-1">
                        +{job.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                {job.missingSkills.length > 0 && (
                  <div>
                    <div className="text-white/60 text-xs mb-2">Skills to Learn</div>
                    <div className="flex flex-wrap gap-2">
                      {job.missingSkills.slice(0, 3).map(skill => (
                        <span
                          key={skill}
                          className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.missingSkills.length > 3 && (
                        <span className="text-white/60 text-xs px-2 py-1">
                          +{job.missingSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-white/80 font-semibold">{job.salary}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                >
                  View Details →
                </button>
              </div>
            </div>
          );
        })}

        {jobMatches.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <div className="text-white/60 text-lg mb-2">No job matches yet</div>
            <p className="text-white/40 text-sm">
              Complete more roadmap steps to unlock job recommendations
            </p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-3xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-white text-3xl font-bold mb-2">{selectedJob.title}</h3>
                <p className="text-white/70 text-lg">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Match Score */}
            <div className="bg-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white/60 text-sm mb-1">Match Score</div>
                  <div className="text-white text-4xl font-bold">{selectedJob.matchScore}%</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm mb-1">Job Readiness</div>
                  <div className="text-white text-4xl font-bold">{selectedJob.readinessLevel}%</div>
                </div>
              </div>
              <div className="text-white/80 text-lg font-semibold">{selectedJob.salary}</div>
            </div>

            {/* Required Skills */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedJob.requiredSkills.map(skill => (
                  <span
                    key={skill}
                    className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            {selectedJob.missingSkills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Skills to Develop</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.missingSkills.map(skill => (
                    <span
                      key={skill}
                      className="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-white/60 text-sm mt-3">
                  💡 Add these skills to your roadmap to increase your match score
                </p>
              </div>
            )}

            {/* AI Recommendation */}
            <div className="bg-purple-500/20 border border-purple-400/50 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h4 className="text-white font-semibold mb-2">AI Recommendation</h4>
                  <p className="text-white/80 text-sm">
                    {selectedJob.readinessLevel >= 80
                      ? "You're ready to apply! Your skills align well with this role."
                      : selectedJob.readinessLevel >= 60
                      ? `You're close! Focus on ${selectedJob.missingSkills.slice(0, 2).join(' and ')} to boost your readiness.`
                      : `Build more projects and complete ${selectedJob.missingSkills.length} more skills to be competitive for this role.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => toggleSaveJob(selectedJob.id)}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
              >
                {savedJobs.includes(selectedJob.id) ? '⭐ Saved' : '☆ Save Job'}
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

