/**
 * AI Service Module
 * 
 * This module provides intelligent career guidance through:
 * - User profile analysis
 * - Dynamic roadmap generation
 * - Adaptive learning recommendations
 * - Project idea generation
 * - Job matching
 * - Resume building
 * 
 * Currently uses rule-based + mock AI logic.
 * Structured for easy integration with real LLM APIs later.
 */

export interface UserProfile {
  mainGoal: string;
  secondaryGoal: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: number;
  pastSkills: string[];
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  skills: string[];
  resources: Resource[];
  completed: boolean;
  order: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'book' | 'practice';
  url: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AISuggestion {
  id: string;
  type: 'add' | 'reorder' | 'remove' | 'modify';
  stepId?: string;
  reason: string;
  data: any;
  confidence: number;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skill: string;
}

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  estimatedHours: number;
  jobRelevance: number;
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  requiredSkills: string[];
  missingSkills: string[];
  readinessLevel: number;
  salary: string;
}

export interface ResumeSection {
  summary: string;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  experience: string;
}

class AIService {
  /**
   * Analyze user profile and generate personalized insights
   */
  analyzeUserProfile(profile: UserProfile): {
    careerPath: string;
    estimatedTimeToGoal: string;
    strengths: string[];
    areasToFocus: string[];
  } {
    const { mainGoal, experienceLevel, weeklyHours, pastSkills } = profile;

    // Rule-based analysis (can be replaced with LLM API)
    const totalHoursNeeded = this.estimateTotalHours(mainGoal, experienceLevel);
    const weeksNeeded = Math.ceil(totalHoursNeeded / weeklyHours);
    
    const strengths = this.identifyStrengths(pastSkills, mainGoal);
    const areasToFocus = this.identifyGaps(pastSkills, mainGoal);

    return {
      careerPath: this.determineCareerPath(mainGoal),
      estimatedTimeToGoal: this.formatTimeEstimate(weeksNeeded),
      strengths,
      areasToFocus,
    };
  }

  /**
   * Generate dynamic roadmap based on user profile
   */
  generateRoadmap(profile: UserProfile): RoadmapStep[] {
    const { mainGoal, experienceLevel, learningStyle, pastSkills } = profile;

    // Get base roadmap template
    const baseSteps = this.getRoadmapTemplate(mainGoal, experienceLevel);

    // Customize based on past skills (skip redundant steps)
    const filteredSteps = baseSteps.filter(step => {
      const hasSkill = step.skills.some(skill => 
        pastSkills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()))
      );
      return !hasSkill;
    });

    // Adjust resources based on learning style
    const customizedSteps = filteredSteps.map(step => ({
      ...step,
      resources: this.customizeResources(step.resources, learningStyle),
    }));

    return customizedSteps;
  }

  /**
   * Generate AI suggestions for roadmap improvements
   */
  generateRoadmapSuggestions(
    roadmap: RoadmapStep[],
    profile: UserProfile,
    completedSteps: string[]
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Analyze progress and suggest optimizations
    const completionRate = completedSteps.length / roadmap.length;

    // Suggest adding advanced topics if progressing well
    if (completionRate > 0.6 && profile.experienceLevel !== 'beginner') {
      suggestions.push({
        id: `suggest-${Date.now()}-1`,
        type: 'add',
        reason: 'You\'re progressing well! Consider adding advanced topics to accelerate your growth.',
        data: this.getAdvancedTopics(profile.mainGoal),
        confidence: 0.85,
      });
    }

    // Suggest reordering if struggling
    const recentSteps = roadmap.slice(-3);
    if (recentSteps.every(s => !completedSteps.includes(s.id))) {
      suggestions.push({
        id: `suggest-${Date.now()}-2`,
        type: 'reorder',
        reason: 'Consider tackling easier topics first to build momentum.',
        data: { reorderStrategy: 'difficulty-ascending' },
        confidence: 0.75,
      });
    }

    // Suggest removing redundant steps
    roadmap.forEach(step => {
      const hasSkill = step.skills.every(skill =>
        profile.pastSkills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()))
      );
      if (hasSkill) {
        suggestions.push({
          id: `suggest-${Date.now()}-${step.id}`,
          type: 'remove',
          stepId: step.id,
          reason: `You already have experience with ${step.skills.join(', ')}. Consider skipping this step.`,
          data: { stepId: step.id },
          confidence: 0.9,
        });
      }
    });

    return suggestions;
  }

  /**
   * Determine if user is ready to move on from current topic
   */
  assessReadiness(
    skill: string,
    questionsAnswered: number,
    correctAnswers: number,
    _timeSpent: number
  ): {
    isReady: boolean;
    confidence: number;
    recommendation: string;
    nextSteps: string[];
  } {
    const accuracy = correctAnswers / questionsAnswered;
    const minimumQuestions = 10;
    const targetAccuracy = 0.75;

    const isReady = 
      questionsAnswered >= minimumQuestions && 
      accuracy >= targetAccuracy;

    let recommendation = '';
    const nextSteps: string[] = [];

    if (isReady) {
      recommendation = `Great job! You've mastered ${skill}. Ready to move forward.`;
      nextSteps.push('Move to next topic');
      nextSteps.push('Try a practice project');
    } else if (accuracy < targetAccuracy) {
      recommendation = `Keep practicing ${skill}. Aim for ${Math.round(targetAccuracy * 100)}% accuracy.`;
      nextSteps.push('Review key concepts');
      nextSteps.push('Try more practice questions');
    } else {
      recommendation = `You're doing well! Complete ${minimumQuestions - questionsAnswered} more questions.`;
      nextSteps.push('Continue practicing');
    }

    return {
      isReady,
      confidence: accuracy,
      recommendation,
      nextSteps,
    };
  }

  /**
   * Generate adaptive practice questions
   */
  generatePracticeQuestions(
    skill: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number
  ): PracticeQuestion[] {
    // Mock question generation (replace with LLM API)
    const questionBank = this.getQuestionBank(skill);
    return questionBank
      .filter(q => q.difficulty === difficulty)
      .slice(0, count);
  }

  /**
   * Adapt difficulty based on performance
   */
  adaptDifficulty(
    currentDifficulty: 'easy' | 'medium' | 'hard',
    recentAccuracy: number
  ): 'easy' | 'medium' | 'hard' {
    if (recentAccuracy > 0.85 && currentDifficulty !== 'hard') {
      return currentDifficulty === 'easy' ? 'medium' : 'hard';
    } else if (recentAccuracy < 0.6 && currentDifficulty !== 'easy') {
      return currentDifficulty === 'hard' ? 'medium' : 'easy';
    }
    return currentDifficulty;
  }

  /**
   * Generate project ideas based on skills learned
   */
  generateProjectIdeas(
    completedSkills: string[],
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): ProjectIdea[] {
    const projectTemplates = this.getProjectTemplates();
    
    return projectTemplates
      .filter(project => {
        // Match project skills with completed skills
        const matchingSkills = project.skills.filter(skill =>
          completedSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
        );
        return matchingSkills.length >= project.skills.length * 0.6;
      })
      .filter(project => {
        // Filter by experience level
        const levelMap = { beginner: 1, intermediate: 2, advanced: 3 };
        return levelMap[project.difficulty] <= levelMap[experienceLevel] + 1;
      })
      .sort((a, b) => b.jobRelevance - a.jobRelevance)
      .slice(0, 5);
  }

  /**
   * Match jobs based on skills and experience
   */
  matchJobs(
    userSkills: string[],
    completedProjects: number,
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): JobMatch[] {
    const jobListings = this.getJobListings();

    return jobListings
      .map(job => {
        const matchingSkills = job.requiredSkills.filter(skill =>
          userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
        );
        const missingSkills = job.requiredSkills.filter(skill =>
          !userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
        );

        const skillMatchScore = matchingSkills.length / job.requiredSkills.length;
        const projectBonus = Math.min(completedProjects * 0.1, 0.3);
        const matchScore = Math.min((skillMatchScore + projectBonus) * 100, 100);

        const readinessLevel = this.calculateReadiness(
          matchScore,
          experienceLevel,
          completedProjects
        );

        return {
          ...job,
          matchScore: Math.round(matchScore),
          missingSkills,
          readinessLevel,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  /**
   * Build resume content dynamically
   */
  buildResume(
    profile: UserProfile,
    completedSkills: string[],
    completedProjects: Array<{ title: string; description: string; skills: string[] }>
  ): ResumeSection {
    const summary = this.generateSummary(profile, completedSkills);
    
    const projects = completedProjects.map(project => ({
      title: project.title,
      description: project.description,
      technologies: project.skills,
    }));

    const experience = this.generateExperienceStatement(
      profile.experienceLevel,
      completedSkills.length,
      completedProjects.length
    );

    return {
      summary,
      skills: completedSkills,
      projects,
      experience,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private estimateTotalHours(goal: string, level: string): number {
    const baseHours: Record<string, number> = {
      'frontend developer': 300,
      'backend developer': 350,
      'full stack developer': 500,
      'data scientist': 400,
      'mobile developer': 350,
      'devops engineer': 400,
    };

    const levelMultiplier = {
      beginner: 1.5,
      intermediate: 1.0,
      advanced: 0.7,
    };

    const base = baseHours[goal.toLowerCase()] || 300;
    return base * levelMultiplier[level as keyof typeof levelMultiplier];
  }

  private formatTimeEstimate(weeks: number): string {
    if (weeks < 4) return `${weeks} weeks`;
    if (weeks < 52) return `${Math.round(weeks / 4)} months`;
    return `${Math.round(weeks / 52)} years`;
  }

  private identifyStrengths(pastSkills: string[], _goal: string): string[] {
    // Mock strength identification
    return pastSkills.slice(0, 3);
  }

  private identifyGaps(pastSkills: string[], _goal: string): string[] {
    // Mock gap identification
    const allSkills = ['JavaScript', 'React', 'Node.js', 'Databases', 'Testing'];
    return allSkills.filter(skill => 
      !pastSkills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()))
    ).slice(0, 3);
  }

  private determineCareerPath(goal: string): string {
    const paths: Record<string, string> = {
      'frontend developer': 'Frontend Development → Senior Frontend → Tech Lead',
      'backend developer': 'Backend Development → Senior Backend → Solutions Architect',
      'full stack developer': 'Full Stack Development → Senior Full Stack → Engineering Manager',
      'data scientist': 'Data Analysis → Data Scientist → Senior Data Scientist → ML Engineer',
    };
    return paths[goal.toLowerCase()] || 'Software Development → Senior Developer → Tech Lead';
  }

  private getRoadmapTemplate(goal: string, _level: string): RoadmapStep[] {
    // Mock roadmap templates (replace with LLM generation)
    const templates: Record<string, RoadmapStep[]> = {
      'frontend developer': [
        {
          id: 'step-1',
          title: 'HTML & CSS Fundamentals',
          description: 'Master the building blocks of web development',
          estimatedHours: 40,
          skills: ['HTML', 'CSS', 'Responsive Design'],
          resources: [],
          completed: false,
          order: 1,
        },
        {
          id: 'step-2',
          title: 'JavaScript Essentials',
          description: 'Learn modern JavaScript programming',
          estimatedHours: 60,
          skills: ['JavaScript', 'ES6+', 'DOM Manipulation'],
          resources: [],
          completed: false,
          order: 2,
        },
        {
          id: 'step-3',
          title: 'React Framework',
          description: 'Build interactive UIs with React',
          estimatedHours: 80,
          skills: ['React', 'Components', 'Hooks', 'State Management'],
          resources: [],
          completed: false,
          order: 3,
        },
        {
          id: 'step-4',
          title: 'Advanced React & Next.js',
          description: 'Master server-side rendering and advanced patterns',
          estimatedHours: 60,
          skills: ['Next.js', 'SSR', 'API Routes', 'Performance'],
          resources: [],
          completed: false,
          order: 4,
        },
      ],
    };

    return templates[goal.toLowerCase()] || templates['frontend developer'];
  }

  private customizeResources(resources: Resource[], style: string): Resource[] {
    // Prioritize resources based on learning style
    return resources.sort((a, b) => {
      const stylePreference: Record<string, string[]> = {
        visual: ['video', 'course'],
        'hands-on': ['practice', 'course'],
        reading: ['article', 'book'],
        mixed: ['course', 'video', 'article'],
      };

      const preferred = stylePreference[style] || [];
      const aScore = preferred.indexOf(a.type);
      const bScore = preferred.indexOf(b.type);

      return (bScore === -1 ? 999 : bScore) - (aScore === -1 ? 999 : aScore);
    });
  }

  private getAdvancedTopics(goal: string): RoadmapStep[] {
    return [
      {
        id: `advanced-${Date.now()}`,
        title: 'Advanced Patterns & Architecture',
        description: 'Learn design patterns and system architecture',
        estimatedHours: 40,
        skills: ['Design Patterns', 'Architecture', 'Best Practices'],
        resources: [],
        completed: false,
        order: 999,
      },
    ];
  }

  private getQuestionBank(skill: string): PracticeQuestion[] {
    // Mock question bank
    return [
      {
        id: 'q1',
        question: `What is the main purpose of ${skill}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: 'Explanation here',
        difficulty: 'easy',
        skill,
      },
    ];
  }

  private getProjectTemplates(): ProjectIdea[] {
    return [
      {
        id: 'proj-1',
        title: 'Personal Portfolio Website',
        description: 'Build a responsive portfolio to showcase your work',
        difficulty: 'beginner',
        skills: ['HTML', 'CSS', 'JavaScript'],
        estimatedHours: 20,
        jobRelevance: 8,
      },
      {
        id: 'proj-2',
        title: 'Todo App with React',
        description: 'Create a full-featured todo application',
        difficulty: 'beginner',
        skills: ['React', 'JavaScript', 'State Management'],
        estimatedHours: 15,
        jobRelevance: 7,
      },
      {
        id: 'proj-3',
        title: 'E-commerce Product Page',
        description: 'Build a dynamic product page with cart functionality',
        difficulty: 'intermediate',
        skills: ['React', 'API Integration', 'State Management'],
        estimatedHours: 30,
        jobRelevance: 9,
      },
      {
        id: 'proj-4',
        title: 'Full Stack Blog Platform',
        description: 'Create a complete blog with authentication and CMS',
        difficulty: 'advanced',
        skills: ['React', 'Node.js', 'Database', 'Authentication'],
        estimatedHours: 60,
        jobRelevance: 10,
      },
    ];
  }

  private getJobListings(): JobMatch[] {
    return [
      {
        id: 'job-1',
        title: 'Junior Frontend Developer',
        company: 'Tech Startup Inc',
        matchScore: 0,
        requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
        missingSkills: [],
        readinessLevel: 0,
        salary: '$60k - $80k',
      },
      {
        id: 'job-2',
        title: 'Frontend Developer',
        company: 'Digital Agency',
        matchScore: 0,
        requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind'],
        missingSkills: [],
        readinessLevel: 0,
        salary: '$80k - $100k',
      },
      {
        id: 'job-3',
        title: 'Senior Frontend Engineer',
        company: 'Enterprise Corp',
        matchScore: 0,
        requiredSkills: ['React', 'TypeScript', 'Testing', 'Architecture', 'Leadership'],
        missingSkills: [],
        readinessLevel: 0,
        salary: '$120k - $150k',
      },
    ];
  }

  private calculateReadiness(
    matchScore: number,
    level: string,
    projects: number
  ): number {
    let readiness = matchScore;

    if (level === 'beginner') readiness *= 0.7;
    if (level === 'advanced') readiness *= 1.2;

    readiness += Math.min(projects * 5, 20);

    return Math.min(Math.round(readiness), 100);
  }

  private generateSummary(profile: UserProfile, skills: string[]): string {
    const { mainGoal, experienceLevel } = profile;
    const skillCount = skills.length;

    return `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)} ${mainGoal} with ${skillCount} technical skills. Passionate about building quality software and continuous learning.`;
  }

  private generateExperienceStatement(
    level: string,
    skillCount: number,
    projectCount: number
  ): string {
    return `Completed ${projectCount} projects demonstrating proficiency in ${skillCount} technologies. ${level === 'advanced' ? 'Experienced in' : 'Developing expertise in'} modern development practices.`;
  }
}

// Export singleton instance
export const aiService = new AIService();



