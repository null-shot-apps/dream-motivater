'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { enhancedAIService } from '@/services/enhancedAIService';
import { parseDocument, validateFile } from '@/utils/fileUtils';
import { UserProfile } from '@/services/aiService';

export default function ProfileView() {
  const appContext = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(appContext.userProfile!);
  
  // Search states
  const [goalSearch, setGoalSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  
  // File upload
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'resume' | 'roadmap'>('resume');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roadmapInputRef = useRef<HTMLInputElement>(null);

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

  const addGoal = (goal: string) => {
    if (!editedProfile.mainGoal) {
      setEditedProfile({ ...editedProfile, mainGoal: goal });
    } else if (!editedProfile.secondaryGoal) {
      setEditedProfile({ ...editedProfile, secondaryGoal: goal });
    }
    setGoalSearch('');
    setGoalSuggestions([]);
  };

  const addSkill = (skill: string) => {
    if (!editedProfile.pastSkills.includes(skill)) {
      setEditedProfile({
        ...editedProfile,
        pastSkills: [...editedProfile.pastSkills, skill],
      });
    }
    setSkillSearch('');
    setSkillSuggestions([]);
  };

  const removeSkill = (skill: string) => {
    setEditedProfile({
      ...editedProfile,
      pastSkills: editedProfile.pastSkills.filter((s: string) => s !== skill),
    });
  };

  const handleSave = () => {
    appContext.setUserProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(appContext.userProfile!);
    setIsEditing(false);
  };

  const handleFileUpload = async (file: File, type: 'resume' | 'roadmap') => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    setAnalysisResult('');
    try {
      const parsed = await parseDocument(file, type);
      
      // Analyze with AI
      const analysis = type === 'resume' 
        ? await enhancedAIService.analyzeResume(parsed)
        : await enhancedAIService.analyzeRoadmap(parsed);
      
      // Show analysis results
      const resultText = `
📊 Analysis Complete (${Math.round(analysis.confidence * 100)}% confidence)

${analysis.summary}

💡 Suggestions:
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

✨ Improvements:
${analysis.improvements.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}
      `.trim();
      
      setAnalysisResult(resultText);
      
      // Store document reference in localStorage
      const storageKey = type === 'resume' ? 'uploaded-resume' : 'uploaded-roadmap';
      localStorage.setItem(storageKey, JSON.stringify({
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        analysis: resultText,
      }));
      
    } catch (error) {
      alert(`Error uploading file: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Your Profile</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Career Goals */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Career Goals</h3>
          
          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Primary Goal</p>
                <p className="text-lg font-medium text-gray-800">{appContext.userProfile?.mainGoal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Secondary Goal</p>
                <p className="text-lg font-medium text-gray-800">{appContext.userProfile?.secondaryGoal}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Primary Goal</label>
                <div className="relative">
                  <input
                    type="text"
                    value={goalSearch}
                    onChange={(e) => handleGoalSearch(e.target.value)}
                    placeholder="Search for goals..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {goalSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl max-h-48 overflow-y-auto border border-gray-200">
                      {goalSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => addGoal(suggestion)}
                          className="w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-lg font-medium text-gray-800 mt-2">{editedProfile.mainGoal}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">Secondary Goal</label>
                <p className="text-lg font-medium text-gray-800">{editedProfile.secondaryGoal}</p>
              </div>
            </div>
          )}
        </div>

        {/* Experience & Time */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Learning Details</h3>
          
          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Experience Level</p>
                <p className="text-lg font-medium text-gray-800 capitalize">{appContext.userProfile?.experienceLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Weekly Commitment</p>
                <p className="text-lg font-medium text-gray-800">{appContext.userProfile?.weeklyHours} hours/week</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Learning Style</p>
                <p className="text-lg font-medium text-gray-800 capitalize">{appContext.userProfile?.learningStyle}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-2">Experience Level</label>
                <select
                  value={editedProfile.experienceLevel}
                  onChange={(e) => setEditedProfile({ ...editedProfile, experienceLevel: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">Weekly Hours</label>
                <select
                  value={editedProfile.weeklyHours}
                  onChange={(e) => setEditedProfile({ ...editedProfile, weeklyHours: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value={5}>5 hours/week</option>
                  <option value={10}>10 hours/week</option>
                  <option value={20}>20 hours/week</option>
                  <option value={40}>40+ hours/week</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">Learning Style</label>
                <select
                  value={editedProfile.learningStyle}
                  onChange={(e) => setEditedProfile({ ...editedProfile, learningStyle: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="visual">Visual</option>
                  <option value="hands-on">Hands-on</option>
                  <option value="reading">Reading</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Skills</h3>
        
        {isEditing && (
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => handleSkillSearch(e.target.value)}
                placeholder="Search and add skills..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {skillSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl max-h-48 overflow-y-auto border border-gray-200">
                  {skillSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => addSkill(suggestion)}
                      className="w-full text-left p-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(isEditing ? editedProfile : appContext.userProfile)?.pastSkills.map((skill: string) => (
            <div
              key={skill}
              className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-4 py-2 rounded-full flex items-center gap-2"
            >
              <span>{skill}</span>
              {isEditing && (
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-red-500 font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document Upload */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📄 Documents & AI Analysis</h3>
        <p className="text-gray-600 mb-4">Upload your resume or roadmap for intelligent AI analysis and suggestions</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Resume Upload */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 hover:border-purple-500 transition-colors">
            <h4 className="font-semibold text-gray-700 mb-2">📝 Resume</h4>
            <p className="text-sm text-gray-500 mb-3">Get AI suggestions to improve your resume</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'resume');
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              {uploading && uploadType === 'resume' ? 'Analyzing...' : 'Upload Resume'}
            </button>
          </div>

          {/* Roadmap Upload */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
            <h4 className="font-semibold text-gray-700 mb-2">🗺️ Roadmap</h4>
            <p className="text-sm text-gray-500 mb-3">AI will analyze and suggest improvements</p>
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
              disabled={uploading}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              {uploading && uploadType === 'roadmap' ? 'Analyzing...' : 'Upload Roadmap'}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>🤖</span> AI Analysis Results
            </h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{analysisResult}</pre>
          </div>
        )}

        {/* Uploaded Documents History */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-2">📚 Uploaded Documents</h4>
          <div className="space-y-2">
            {(() => {
              const resume = localStorage.getItem('uploaded-resume');
              const roadmap = localStorage.getItem('uploaded-roadmap');
              const docs = [];
              
              if (resume) {
                const data = JSON.parse(resume);
                docs.push(
                  <div key="resume" className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">📝 {data.fileName}</p>
                      <p className="text-xs text-gray-500">Uploaded: {new Date(data.uploadDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAnalysisResult(data.analysis);
                      }}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      View Analysis
                    </button>
                  </div>
                );
              }
              
              if (roadmap) {
                const data = JSON.parse(roadmap);
                docs.push(
                  <div key="roadmap" className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">🗺️ {data.fileName}</p>
                      <p className="text-xs text-gray-500">Uploaded: {new Date(data.uploadDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAnalysisResult(data.analysis);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Analysis
                    </button>
                  </div>
                );
              }
              
              return docs.length > 0 ? docs : (
                <p className="text-sm text-gray-500 italic">No documents uploaded yet</p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Roadmap Progress</p>
          <p className="text-3xl font-bold">
            {appContext.roadmap.length > 0 ? Math.round((appContext.completedSteps.length / appContext.roadmap.length) * 100) : 0}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Skills Learned</p>
          <p className="text-3xl font-bold">{appContext.userProfile?.pastSkills.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Projects Completed</p>
          <p className="text-3xl font-bold">{appContext.completedProjects.length}</p>
        </div>
      </div>
    </div>
  );
}











