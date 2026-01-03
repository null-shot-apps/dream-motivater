'use client';

import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService } from '@/services/aiService';

export default function ResumeView() {
  const { userProfile, completedSteps, roadmap, completedProjects, resume, updateResume } = useApp();

  useEffect(() => {
    if (userProfile && roadmap.length > 0) {
      // Get completed skills
      const completedSkills = roadmap
        .filter(step => completedSteps.includes(step.id))
        .flatMap(step => step.skills)
        .filter((skill, index, self) => self.indexOf(skill) === index);

      // Build resume using AI
      const generatedResume = aiService.buildResume(
        userProfile,
        completedSkills,
        completedProjects
      );
      updateResume(generatedResume);
    }
  }, [userProfile, roadmap, completedSteps, completedProjects, updateResume]);

  const handleDownload = () => {
    if (!resume) return;

    const resumeText = `
${userProfile?.mainGoal?.toUpperCase() || 'PROFESSIONAL'}

SUMMARY
${resume.summary}

SKILLS
${resume.skills.join(' • ')}

PROJECTS
${resume.projects.map(p => `
${p.title}
${p.description}
Technologies: ${p.technologies.join(', ')}
`).join('\n')}

EXPERIENCE
${resume.experience}
    `.trim();

    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!resume) {
    return (
      <div className="text-center py-12">
        <div className="text-white/60 text-lg">
          Complete your roadmap to generate your resume
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-2xl font-bold mb-2">AI-Generated Resume</h2>
            <p className="text-white/70">
              Your resume updates automatically as you progress
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            📥 Download
          </button>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="bg-white rounded-2xl p-12 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {userProfile?.mainGoal || 'Professional'}
          </h1>
          <p className="text-gray-600">
            {userProfile?.experienceLevel ? userProfile.experienceLevel.charAt(0).toUpperCase() + userProfile.experienceLevel.slice(1) : 'Professional'} Level
          </p>
        </div>

        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-purple-600">📝</span>
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">{resume.summary}</p>
        </div>

        {/* Skills */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-purple-600">⚡</span>
            Technical Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map(skill => (
              <span
                key={skill}
                className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Projects */}
        {resume.projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-600">🚀</span>
              Projects
            </h2>
            <div className="space-y-6">
              {resume.projects.map((project, index) => (
                <div key={index} className="border-l-4 border-purple-600 pl-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map(tech => (
                      <span
                        key={tech}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Statement */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-purple-600">💼</span>
            Experience
          </h2>
          <p className="text-gray-700 leading-relaxed">{resume.experience}</p>
        </div>

        {/* Learning Journey */}
        <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            🎓 Continuous Learning
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {completedSteps.length}
              </div>
              <div className="text-sm text-gray-600">Topics Mastered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {completedProjects.length}
              </div>
              <div className="text-sm text-gray-600">Projects Built</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {resume.skills.length}
              </div>
              <div className="text-sm text-gray-600">Skills Acquired</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="text-white font-semibold mb-2">AI Resume Tips</h3>
            <ul className="text-white/80 text-sm space-y-2">
              <li>✓ Your resume updates automatically as you complete projects</li>
              <li>✓ Focus on completing projects to strengthen your portfolio</li>
              <li>✓ Each skill you master is added to your technical skills section</li>
              <li>✓ Download and customize for specific job applications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


