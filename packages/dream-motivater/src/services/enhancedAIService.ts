/**
 * Enhanced AI Service with Real API Integration
 * 
 * Supports multiple free AI providers:
 * - Hugging Face Inference API (free tier)
 * - Can be extended to OpenAI, Anthropic, etc.
 */

import { ParsedDocument } from '@/utils/fileUtils';

export interface EnhancedUserProfile {
  primaryGoals: string[]; // Multiple primary goals
  secondaryGoals: string[]; // Multiple secondary goals
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: number;
  skills: string[]; // User's current skills
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
  uploadedResume?: ParsedDocument;
  uploadedRoadmap?: ParsedDocument;
}

export interface AIAnalysis {
  summary: string;
  suggestions: string[];
  improvements: string[];
  confidence: number;
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'book' | 'practice' | 'documentation';
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  rating?: number;
  isFree: boolean;
}

export interface ProgressiveProject {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  newConcepts: string[]; // What new things user will learn
  estimatedHours: number;
  confidenceBoost: number; // 1-10 scale
  jobRelevance: number; // 1-10 scale
  prerequisites: string[];
  learningOutcomes: string[];
}

class EnhancedAIService {
  private huggingFaceApiKey: string | null = null;
  private useRealAPI = false;

  /**
   * Initialize with API keys (optional)
   */
  initialize(config?: { huggingFaceApiKey?: string }) {
    if (config?.huggingFaceApiKey) {
      this.huggingFaceApiKey = config.huggingFaceApiKey;
      this.useRealAPI = true;
    }
  }

  /**
   * Analyze uploaded resume
   */
  async analyzeResume(document: ParsedDocument): Promise<AIAnalysis> {
    if (this.useRealAPI && this.huggingFaceApiKey) {
      return await this.analyzeWithHuggingFace(document.text, 'resume');
    }

    // Fallback: Rule-based analysis
    return this.analyzeResumeRuleBased(document.text);
  }

  /**
   * Analyze uploaded roadmap
   */
  async analyzeRoadmap(document: ParsedDocument): Promise<AIAnalysis> {
    if (this.useRealAPI && this.huggingFaceApiKey) {
      return await this.analyzeWithHuggingFace(document.text, 'roadmap');
    }

    // Fallback: Rule-based analysis
    return this.analyzeRoadmapRuleBased(document.text);
  }

  /**
   * Get learning resources from free sources
   */
  async getLearningResources(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    learningStyle: string
  ): Promise<LearningResource[]> {
    // Curated free resources
    const resources: LearningResource[] = [];

    // Add resources based on topic and difficulty
    const topicResources = this.getFreeResourcesForTopic(topic, difficulty);
    
    // Filter and sort by learning style
    const filtered = topicResources.filter(r => {
      if (learningStyle === 'visual') return r.type === 'video' || r.type === 'course';
      if (learningStyle === 'hands-on') return r.type === 'practice' || r.type === 'course';
      if (learningStyle === 'reading') return r.type === 'article' || r.type === 'documentation';
      return true; // mixed
    });

    resources.push(...filtered);

    // Always include some variety
    if (resources.length < 5) {
      resources.push(...topicResources.slice(0, 5 - resources.length));
    }

    return resources.slice(0, 10);
  }

  /**
   * Generate progressive projects (beginner → intermediate → advanced)
   */
  generateProgressiveProjects(
    goals: string[],
    currentSkills: string[],
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): ProgressiveProject[] {
    const allProjects = this.getProjectDatabase();

    // Filter projects relevant to goals
    const relevantProjects = allProjects.filter(project =>
      goals.some(goal => 
        project.skills.some(skill => 
          goal.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(goal.toLowerCase())
        )
      )
    );

    // Create progression: beginner → intermediate → advanced
    const progression: ProgressiveProject[] = [];

    // Start with beginner projects
    const beginnerProjects = relevantProjects
      .filter(p => p.difficulty === 'beginner')
      .filter(p => this.hasPrerequisites(p, currentSkills))
      .sort((a, b) => b.confidenceBoost - a.confidenceBoost)
      .slice(0, 2);

    progression.push(...beginnerProjects);

    // Add intermediate projects that build on beginner skills
    const learnedSkills = [...currentSkills, ...beginnerProjects.flatMap(p => p.skills)];
    const intermediateProjects = relevantProjects
      .filter(p => p.difficulty === 'intermediate')
      .filter(p => this.hasPrerequisites(p, learnedSkills))
      .sort((a, b) => b.jobRelevance - a.jobRelevance)
      .slice(0, 2);

    progression.push(...intermediateProjects);

    // Add advanced projects if user is ready
    if (experienceLevel !== 'beginner') {
      const allLearnedSkills = [...learnedSkills, ...intermediateProjects.flatMap(p => p.skills)];
      const advancedProjects = relevantProjects
        .filter(p => p.difficulty === 'advanced')
        .filter(p => this.hasPrerequisites(p, allLearnedSkills))
        .sort((a, b) => b.jobRelevance - a.jobRelevance)
        .slice(0, 2);

      progression.push(...advancedProjects);
    }

    return progression;
  }

  /**
   * Search for goals (not fixed list)
   */
  searchGoals(query: string): string[] {
    const allGoals = [
      // Tech roles
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Data Analyst', 'Data Scientist', 'Machine Learning Engineer',
      'Mobile Developer', 'iOS Developer', 'Android Developer',
      'DevOps Engineer', 'Cloud Engineer', 'Security Engineer',
      'UI/UX Designer', 'Product Manager', 'QA Engineer',
      
      // Part-time/Service roles
      'Customer Service Representative', 'Age Care Worker', 'Retail Assistant',
      'Administrative Assistant', 'Virtual Assistant', 'Content Writer',
      'Social Media Manager', 'Tutor', 'Freelance Developer',
    ];

    if (!query) return allGoals.slice(0, 10);

    const filtered = allGoals.filter(goal =>
      goal.toLowerCase().includes(query.toLowerCase())
    );

    // Allow custom goals if no matches
    if (filtered.length === 0 && query.length > 2) {
      return [query, ...allGoals.slice(0, 5)];
    }

    return filtered.slice(0, 10);
  }

  /**
   * Search for skills (not fixed list)
   */
  searchSkills(query: string): string[] {
    const allSkills = [
      // Programming languages
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP', 'Ruby',
      
      // Frontend
      'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Next.js', 'Tailwind CSS', 'SASS',
      
      // Backend
      'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'ASP.NET',
      
      // Databases
      'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase',
      
      // Tools
      'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Testing',
      
      // Data Science
      'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Data Visualization',
      
      // Soft skills
      'Communication', 'Problem Solving', 'Team Collaboration', 'Time Management',
      'Customer Service', 'Leadership', 'Project Management',
    ];

    if (!query) return allSkills.slice(0, 15);

    const filtered = allSkills.filter(skill =>
      skill.toLowerCase().includes(query.toLowerCase())
    );

    // Allow custom skills if no matches
    if (filtered.length === 0 && query.length > 2) {
      return [query, ...allSkills.slice(0, 10)];
    }

    return filtered.slice(0, 15);
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async analyzeWithHuggingFace(
    text: string,
    type: 'resume' | 'roadmap'
  ): Promise<AIAnalysis> {
    try {
      const prompt = type === 'resume'
        ? `Analyze this resume and provide suggestions for improvement:\n\n${text}`
        : `Analyze this learning roadmap and suggest improvements:\n\n${text}`;

      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.huggingFaceApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json() as any;
      
      return {
        summary: data[0]?.summary_text || 'Analysis completed',
        suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
        improvements: ['Improvement 1', 'Improvement 2'],
        confidence: 0.85,
      };
    } catch (error) {
      console.error('Hugging Face API error:', error);
      // Fallback to rule-based
      return type === 'resume'
        ? this.analyzeResumeRuleBased(text)
        : this.analyzeRoadmapRuleBased(text);
    }
  }

  private analyzeResumeRuleBased(text: string): AIAnalysis {
    const suggestions: string[] = [];
    const improvements: string[] = [];

    // Simple rule-based analysis
    if (!text.toLowerCase().includes('project')) {
      suggestions.push('Add project experience to showcase your skills');
    }
    if (!text.toLowerCase().includes('skill')) {
      suggestions.push('Include a skills section with relevant technologies');
    }
    if (text.length < 500) {
      improvements.push('Expand your resume with more details about your experience');
    }
    if (!text.toLowerCase().includes('github') && !text.toLowerCase().includes('portfolio')) {
      suggestions.push('Add links to your GitHub or portfolio');
    }

    return {
      summary: 'Resume analyzed. Consider adding more project details and quantifiable achievements.',
      suggestions,
      improvements,
      confidence: 0.7,
    };
  }

  private analyzeRoadmapRuleBased(text: string): AIAnalysis {
    const suggestions: string[] = [];
    const improvements: string[] = [];

    if (!text.toLowerCase().includes('project')) {
      suggestions.push('Include hands-on projects to reinforce learning');
    }
    if (!text.toLowerCase().includes('practice')) {
      suggestions.push('Add practice exercises between topics');
    }
    if (text.split('\n').length < 5) {
      improvements.push('Break down the roadmap into more detailed steps');
    }

    return {
      summary: 'Roadmap analyzed. Consider adding more practical exercises and milestones.',
      suggestions,
      improvements,
      confidence: 0.75,
    };
  }

  private getFreeResourcesForTopic(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): LearningResource[] {
    // Curated free resources
    const resourceDatabase: Record<string, LearningResource[]> = {
      'javascript': [
        {
          title: 'JavaScript.info - Modern JavaScript Tutorial',
          url: 'https://javascript.info',
          type: 'documentation',
          provider: 'javascript.info',
          difficulty: 'beginner',
          duration: '40 hours',
          rating: 9.5,
          isFree: true,
        },
        {
          title: 'freeCodeCamp JavaScript Course',
          url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
          type: 'course',
          provider: 'freeCodeCamp',
          difficulty: 'beginner',
          duration: '300 hours',
          rating: 9.0,
          isFree: true,
        },
        {
          title: 'You Don\'t Know JS (book series)',
          url: 'https://github.com/getify/You-Dont-Know-JS',
          type: 'book',
          provider: 'GitHub',
          difficulty: 'intermediate',
          duration: '60 hours',
          rating: 9.8,
          isFree: true,
        },
      ],
      'react': [
        {
          title: 'React Official Documentation',
          url: 'https://react.dev',
          type: 'documentation',
          provider: 'React Team',
          difficulty: 'beginner',
          duration: '20 hours',
          rating: 9.5,
          isFree: true,
        },
        {
          title: 'freeCodeCamp React Course',
          url: 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
          type: 'course',
          provider: 'freeCodeCamp',
          difficulty: 'intermediate',
          duration: '150 hours',
          rating: 9.0,
          isFree: true,
        },
      ],
      'python': [
        {
          title: 'Python.org Official Tutorial',
          url: 'https://docs.python.org/3/tutorial/',
          type: 'documentation',
          provider: 'Python.org',
          difficulty: 'beginner',
          duration: '15 hours',
          rating: 9.0,
          isFree: true,
        },
        {
          title: 'freeCodeCamp Python Course',
          url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
          type: 'course',
          provider: 'freeCodeCamp',
          difficulty: 'beginner',
          duration: '300 hours',
          rating: 9.2,
          isFree: true,
        },
      ],
    };

    const topicKey = topic.toLowerCase().replace(/\s+/g, '');
    const resources = resourceDatabase[topicKey] || [];

    return resources.filter(r => r.difficulty === difficulty || difficulty === 'intermediate');
  }

  private getProjectDatabase(): ProgressiveProject[] {
    return [
      // Beginner projects
      {
        id: 'proj-beginner-1',
        title: 'Personal Portfolio Website',
        description: 'Build a responsive portfolio to showcase your work and skills',
        difficulty: 'beginner',
        skills: ['HTML', 'CSS', 'JavaScript'],
        newConcepts: ['Responsive Design', 'Flexbox/Grid', 'Basic DOM manipulation'],
        estimatedHours: 15,
        confidenceBoost: 9,
        jobRelevance: 8,
        prerequisites: [],
        learningOutcomes: [
          'Understand HTML structure and semantics',
          'Master CSS layouts and responsive design',
          'Learn basic JavaScript for interactivity',
        ],
      },
      {
        id: 'proj-beginner-2',
        title: 'Todo List Application',
        description: 'Create a functional todo app with local storage',
        difficulty: 'beginner',
        skills: ['JavaScript', 'DOM', 'LocalStorage'],
        newConcepts: ['Event handling', 'State management', 'Data persistence'],
        estimatedHours: 12,
        confidenceBoost: 8,
        jobRelevance: 7,
        prerequisites: ['HTML', 'CSS', 'JavaScript'],
        learningOutcomes: [
          'Handle user events and form inputs',
          'Manage application state',
          'Persist data with localStorage',
        ],
      },
      {
        id: 'proj-beginner-3',
        title: 'Weather Dashboard',
        description: 'Build a weather app using a public API',
        difficulty: 'beginner',
        skills: ['JavaScript', 'API', 'Fetch'],
        newConcepts: ['API integration', 'Async/await', 'Error handling'],
        estimatedHours: 18,
        confidenceBoost: 9,
        jobRelevance: 9,
        prerequisites: ['JavaScript'],
        learningOutcomes: [
          'Work with external APIs',
          'Handle asynchronous operations',
          'Display dynamic data',
        ],
      },

      // Intermediate projects
      {
        id: 'proj-intermediate-1',
        title: 'E-commerce Product Page',
        description: 'Build a dynamic product page with cart functionality using React',
        difficulty: 'intermediate',
        skills: ['React', 'State Management', 'Component Design'],
        newConcepts: ['React hooks', 'Context API', 'Component composition'],
        estimatedHours: 25,
        confidenceBoost: 8,
        jobRelevance: 9,
        prerequisites: ['JavaScript', 'React'],
        learningOutcomes: [
          'Build reusable React components',
          'Manage complex state with hooks',
          'Implement shopping cart logic',
        ],
      },
      {
        id: 'proj-intermediate-2',
        title: 'Social Media Dashboard',
        description: 'Create a dashboard with authentication and real-time updates',
        difficulty: 'intermediate',
        skills: ['React', 'Authentication', 'API Integration'],
        newConcepts: ['JWT authentication', 'Protected routes', 'Real-time data'],
        estimatedHours: 35,
        confidenceBoost: 9,
        jobRelevance: 10,
        prerequisites: ['React', 'API'],
        learningOutcomes: [
          'Implement user authentication',
          'Handle protected routes',
          'Work with real-time data',
        ],
      },
      {
        id: 'proj-intermediate-3',
        title: 'Data Visualization Dashboard',
        description: 'Build an interactive dashboard with charts and analytics',
        difficulty: 'intermediate',
        skills: ['React', 'Data Visualization', 'Charts'],
        newConcepts: ['Chart libraries', 'Data transformation', 'Interactive visualizations'],
        estimatedHours: 30,
        confidenceBoost: 8,
        jobRelevance: 9,
        prerequisites: ['React', 'JavaScript'],
        learningOutcomes: [
          'Create interactive charts',
          'Transform and analyze data',
          'Build analytics dashboards',
        ],
      },

      // Advanced projects
      {
        id: 'proj-advanced-1',
        title: 'Full Stack Blog Platform',
        description: 'Create a complete blog with CMS, authentication, and comments',
        difficulty: 'advanced',
        skills: ['React', 'Node.js', 'Database', 'Authentication', 'API Design'],
        newConcepts: ['Backend architecture', 'Database design', 'RESTful APIs', 'Security'],
        estimatedHours: 60,
        confidenceBoost: 10,
        jobRelevance: 10,
        prerequisites: ['React', 'Node.js', 'Database'],
        learningOutcomes: [
          'Design and build RESTful APIs',
          'Implement full authentication system',
          'Design database schemas',
          'Deploy full stack applications',
        ],
      },
      {
        id: 'proj-advanced-2',
        title: 'Real-time Collaboration Tool',
        description: 'Build a collaborative workspace with WebSockets',
        difficulty: 'advanced',
        skills: ['React', 'WebSockets', 'Real-time', 'State Management'],
        newConcepts: ['WebSocket protocol', 'Operational transformation', 'Conflict resolution'],
        estimatedHours: 70,
        confidenceBoost: 10,
        jobRelevance: 10,
        prerequisites: ['React', 'Node.js', 'WebSockets'],
        learningOutcomes: [
          'Implement real-time communication',
          'Handle concurrent updates',
          'Build scalable real-time apps',
        ],
      },
      {
        id: 'proj-advanced-3',
        title: 'Machine Learning Web App',
        description: 'Create a web app that uses ML models for predictions',
        difficulty: 'advanced',
        skills: ['Python', 'Machine Learning', 'API', 'React'],
        newConcepts: ['ML model deployment', 'Model serving', 'ML APIs'],
        estimatedHours: 80,
        confidenceBoost: 10,
        jobRelevance: 10,
        prerequisites: ['Python', 'Machine Learning', 'API'],
        learningOutcomes: [
          'Deploy ML models to production',
          'Build ML-powered APIs',
          'Integrate ML with web apps',
        ],
      },
    ];
  }

  private hasPrerequisites(project: ProgressiveProject, userSkills: string[]): boolean {
    if (project.prerequisites.length === 0) return true;

    return project.prerequisites.every(prereq =>
      userSkills.some(skill => 
        skill.toLowerCase().includes(prereq.toLowerCase()) ||
        prereq.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }
}

// Export singleton
export const enhancedAIService = new EnhancedAIService();


