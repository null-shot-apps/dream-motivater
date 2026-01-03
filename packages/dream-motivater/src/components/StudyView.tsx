'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { aiService, PracticeQuestion } from '@/services/aiService';

export default function StudyView() {
  const { roadmap, completedSteps, currentSkill, setCurrentSkill, updatePracticeStats, practiceStats } = useApp();
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [readinessCheck, setReadinessCheck] = useState<any>(null);

  const nextStep = roadmap.find(step => !completedSteps.includes(step.id));
  const activeSkill = currentSkill || nextStep?.skills[0] || null;

  useEffect(() => {
    if (activeSkill) {
      loadQuestions(activeSkill, difficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSkill]);

  useEffect(() => {
    if (activeSkill && practiceStats[activeSkill]) {
      const stats = practiceStats[activeSkill];
      const readiness = aiService.assessReadiness(
        activeSkill,
        stats.questionsAnswered,
        stats.correctAnswers,
        stats.timeSpent
      );
      setReadinessCheck(readiness);

      // Adapt difficulty based on performance
      if (stats.questionsAnswered >= 5) {
        const accuracy = stats.correctAnswers / stats.questionsAnswered;
        const newDifficulty = aiService.adaptDifficulty(difficulty, accuracy);
        if (newDifficulty !== difficulty) {
          setDifficulty(newDifficulty);
        }
      }
    }
  }, [activeSkill, practiceStats]);

  const loadQuestions = (skill: string, diff: 'easy' | 'medium' | 'hard') => {
    const newQuestions = aiService.generatePracticeQuestions(skill, diff, 10);
    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const question = questions[currentQuestion];
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    if (activeSkill) {
      updatePracticeStats(activeSkill, isCorrect, 30); // 30 seconds per question
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Load more questions
      if (activeSkill) {
        loadQuestions(activeSkill, difficulty);
      }
    }
  };

  const stats = activeSkill ? practiceStats[activeSkill] : null;
  const accuracy = stats ? (stats.correctAnswers / stats.questionsAnswered) * 100 : 0;

  if (!activeSkill) {
    return (
      <div className="text-center py-12">
        <div className="text-white/60 text-lg">
          Complete your roadmap setup to start practicing
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white text-2xl font-bold mb-1">Practice: {activeSkill}</h2>
            <p className="text-white/60">
              Difficulty: <span className="capitalize font-semibold">{difficulty}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-sm">Accuracy</div>
            <div className="text-white text-3xl font-bold">
              {stats ? Math.round(accuracy) : 0}%
            </div>
          </div>
        </div>

        {/* Progress */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-white/60 text-xs mb-1">Questions</div>
              <div className="text-white font-semibold">{stats.questionsAnswered}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs mb-1">Correct</div>
              <div className="text-green-400 font-semibold">{stats.correctAnswers}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs mb-1">Time Spent</div>
              <div className="text-white font-semibold">{Math.round(stats.timeSpent / 60)}m</div>
            </div>
          </div>
        )}
      </div>

      {/* AI Readiness Check */}
      {readinessCheck && (
        <div className={`backdrop-blur-lg rounded-xl p-6 border ${
          readinessCheck.isReady
            ? 'bg-green-500/20 border-green-400/50'
            : 'bg-blue-500/20 border-blue-400/50'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{readinessCheck.isReady ? '🎉' : '💪'}</span>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">
                {readinessCheck.isReady ? 'Ready to Move On!' : 'Keep Going!'}
              </h3>
              <p className="text-white/80 text-sm mb-3">{readinessCheck.recommendation}</p>
              <div className="flex flex-wrap gap-2">
                {readinessCheck.nextSteps.map((step: string, i: number) => (
                  <span
                    key={i}
                    className="bg-white/20 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question */}
      {question && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="mb-6">
            <div className="text-white/60 text-sm mb-2">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <h3 className="text-white text-xl font-semibold mb-4">{question.question}</h3>
          </div>

          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showResult = showExplanation;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    showResult
                      ? isCorrect
                        ? 'bg-green-500/30 border-2 border-green-400'
                        : isSelected
                        ? 'bg-red-500/30 border-2 border-red-400'
                        : 'bg-white/5 border border-white/10'
                      : isSelected
                      ? 'bg-purple-500/30 border-2 border-purple-400'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                        showResult && isCorrect
                          ? 'bg-green-500 text-white'
                          : showResult && isSelected
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-white">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4 mb-6">
              <div className="text-blue-300 font-semibold mb-2">Explanation</div>
              <p className="text-white/80 text-sm">{question.explanation}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            {!showExplanation ? (
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Continue Practicing'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Skill Selector */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-white font-semibold mb-3">Switch Topic</h3>
        <div className="flex flex-wrap gap-2">
          {roadmap
            .filter(step => !completedSteps.includes(step.id))
            .flatMap(step => step.skills)
            .filter((skill, index, self) => self.indexOf(skill) === index)
            .map(skill => (
              <button
                key={skill}
                onClick={() => setCurrentSkill(skill)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  skill === activeSkill
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {skill}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}


