'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService } from '@/services/aiService';
import { extractTextFromFile, downloadTextAsFile } from '@/utils/fileUtils';

export default function ProfileView() {
  const { userProfile, setUserProfile, resetApp } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // File upload states
  const [uploadingRoadmap, setUploadingRoadmap] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [roadmapAnalysis, setRoadmapAnalysis] = useState<any>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);

  if (!userProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No profile data available</p>
      </div>
    );
  }

  const handleSave = () => {
    if (editedProfile) {
      setUserProfile(editedProfile);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(userProfile);
    setIsEditing(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(userProfile, null, 2);
    downloadTextAsFile(data, 'dream-profile.json');
  };

  const handleRoadmapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRoadmap(true);
    try {
      const text = await extractTextFromFile(file);
      const analysis = await aiService.analyzeRoadmap(text, userProfile.primaryGoals || []);
      
      const updated = {
        ...editedProfile!,
        uploadedRoadmap: {
          filename: file.name,
          content: text,
          aiAnalysis: JSON.stringify(analysis),
        },
      };
      
      setEditedProfile(updated);
      setUserProfile(updated);
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
      
      const updated = {
        ...editedProfile!,
        uploadedResume: {
          filename: file.name,
          content: text,
          extractedSkills: analysis.extractedSkills,
        },
      };
      
      setEditedProfile(updated);
      setUserProfile(updated);
      setResumeAnalysis(analysis);
    } catch (error: any) {
      alert(error.message || 'Failed to process resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleReset = () => {
    resetApp();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Your Profile</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            📥 Export
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg text-white rounded-lg transition-all"
            >
              ✏️ Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg text-white rounded-lg transition-all"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Goals Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">🎯 Career Goals</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-white/70 text-sm mb-2 block">Primary Goals</label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {editedProfile?.primaryGoals?.map((goal, index) => (
                  <div key={index} className="bg-purple-500/30 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    <span>{goal}</span>
                    <button
                      onClick={() => {
                        const updated = { ...editedProfile };
                        updated.primaryGoals = updated.primaryGoals?.filter((_, i) => i !== index);
                        setEditedProfile(updated);
                      }}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userProfile.primaryGoals?.map((goal, index) => (
                  <span key={index} className="bg-purple-500/30 text-white px-3 py-1 rounded-full">
                    {goal}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 block">Secondary Goals</label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {editedProfile?.secondaryGoals?.map((goal, index) => (
                  <div key={index} className="bg-blue-500/30 text-white px-3 py-1 rounded-full flex items-center gap-2">
                    <span>{goal}</span>
                    <button
                      onClick={() => {
                        const updated = { ...editedProfile };
                        updated.secondaryGoals = updated.secondaryGoals?.filter((_, i) => i !== index);
                        setEditedProfile(updated);
                      }}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userProfile.secondaryGoals?.map((goal, index) => (
                  <span key={index} className="bg-blue-500/30 text-white px-3 py-1 rounded-full">
                    {goal}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">💡 Skills</h3>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {userProfile.skills?.map((skill, index) => (
            <span key={index} className="bg-green-500/30 text-white px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-white/70 text-sm mb-2">Experience Level</h3>
          {isEditing ? (
            <select
              value={editedProfile?.experienceLevel}
              onChange={(e) => setEditedProfile({ ...editedProfile!, experienceLevel: e.target.value as any })}
              className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          ) : (
            <p className="text-white text-lg font-semibold capitalize">{userProfile.experienceLevel}</p>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-white/70 text-sm mb-2">Weekly Commitment</h3>
          {isEditing ? (
            <input
              type="number"
              value={editedProfile?.weeklyHours}
              onChange={(e) => setEditedProfile({ ...editedProfile!, weeklyHours: parseInt(e.target.value) })}
              className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20"
            />
          ) : (
            <p className="text-white text-lg font-semibold">{userProfile.weeklyHours} hours/week</p>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-white/70 text-sm mb-2">Learning Style</h3>
          {isEditing ? (
            <select
              value={editedProfile?.learningStyle}
              onChange={(e) => setEditedProfile({ ...editedProfile!, learningStyle: e.target.value as any })}
              className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20"
            >
              <option value="visual">Visual</option>
              <option value="hands-on">Hands-on</option>
              <option value="reading">Reading</option>
              <option value="mixed">Mixed</option>
            </select>
          ) : (
            <p className="text-white text-lg font-semibold capitalize">{userProfile.learningStyle}</p>
          )}
        </div>
      </div>

      {/* Uploaded Documents */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">📁 Uploaded Documents</h3>
        
        <div className="space-y-4">
          {/* Resume */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white/80 font-medium">Resume</h4>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden"
                id="resume-reupload"
              />
              <label
                htmlFor="resume-reupload"
                className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {uploadingResume ? 'Uploading...' : userProfile.uploadedResume ? 'Re-upload' : 'Upload'}
              </label>
            </div>
            {userProfile.uploadedResume ? (
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white/80 text-sm">📄 {userProfile.uploadedResume.filename}</p>
                {userProfile.uploadedResume.extractedSkills && (
                  <p className="text-white/60 text-xs mt-1">
                    {userProfile.uploadedResume.extractedSkills.length} skills extracted
                  </p>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No resume uploaded</p>
            )}
            {resumeAnalysis && (
              <div className="mt-2 p-3 bg-green-500/20 rounded-lg">
                <p className="text-green-300 text-xs font-semibold">✓ New analysis complete</p>
                {resumeAnalysis.suggestions && (
                  <ul className="text-white/60 text-xs mt-1 list-disc list-inside">
                    {resumeAnalysis.suggestions.slice(0, 2).map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Roadmap */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white/80 font-medium">Learning Roadmap</h4>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleRoadmapUpload}
                disabled={uploadingRoadmap}
                className="hidden"
                id="roadmap-reupload"
              />
              <label
                htmlFor="roadmap-reupload"
                className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {uploadingRoadmap ? 'Uploading...' : userProfile.uploadedRoadmap ? 'Re-upload' : 'Upload'}
              </label>
            </div>
            {userProfile.uploadedRoadmap ? (
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white/80 text-sm">🗺️ {userProfile.uploadedRoadmap.filename}</p>
                {userProfile.uploadedRoadmap.aiAnalysis && (
                  <p className="text-white/60 text-xs mt-1">AI analysis available</p>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm">No roadmap uploaded</p>
            )}
            {roadmapAnalysis && (
              <div className="mt-2 p-3 bg-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-xs font-semibold">✓ New analysis complete</p>
                <p className="text-white/70 text-xs mt-1">{roadmapAnalysis.analysis}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
        <h3 className="text-xl font-semibold text-red-400 mb-4">⚠️ Danger Zone</h3>
        <p className="text-white/70 text-sm mb-4">
          Reset all your progress and start fresh. This action cannot be undone.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
          >
            Reset All Progress
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

