/**
 * AI Service Module - Enhanced with Real AI Integration
 * 
 * Supports multiple AI providers:
 * - Hugging Face Inference API (FREE)
 * - OpenAI GPT (Paid)
 * - Anthropic Claude (Paid)
 * - Fallback to rule-based logic
 */

export interface UserProfile {
  primaryGoals: string[]; // Multiple primary goals
  secondaryGoals: string[]; // Multiple secondary goals
  skills: string[]; // Searchable, custom skills
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: number;
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
  uploadedRoadmap?: {
    filename: string;
    content: string;
    aiAnalysis?: string;
  };
  uploadedResume?: {
    filename: string;
    content: string;
    extractedSkills?: string[];
  };
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
  concepts: string[]; // New: concepts to learn
  prerequisites: string[]; // New: what you need to know first
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'book' | 'practice' | 'documentation';
  url: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  provider: string;
  rating?: number;
  isFree: boolean;
}

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  concepts: string[]; // What you'll learn
  estimatedHours: number;
  jobRelevance: number;
  confidenceBoost: number; // How much this builds confidence
  realWorldApplication: string;
  milestones: string[];
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
  concept: string;
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
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
}

export interface ResumeSection {
  summary: string;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    impact: string;
  }>;
  experience: string;
  achievements: string[];
}

class AIService {
  private apiKey: string | null = null;
  private provider: 'huggingface' | 'openai' | 'anthropic' | 'fallback' = 'fallback';

  constructor() {
    // Check for API keys in environment
    if (typeof window !== 'undefined') {
      const hfKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
      const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const anthropicKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

      if (hfKey && hfKey !== 'your_huggingface_api_key_here') {
        this.apiKey = hfKey;
        this.provider = 'huggingface';
      } else if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
        this.apiKey = openaiKey;
        this.provider = 'openai';
      } else if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
        this.apiKey = anthropicKey;
        this.provider = 'anthropic';
      }
    }
  }

  /**
   * Call AI API with fallback to rule-based logic
   */
  private async callAI(prompt: string, options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
    try {
      if (this.provider === 'huggingface' && this.apiKey) {
        return await this.callHuggingFace(prompt, options);
      } else if (this.provider === 'openai' && this.apiKey) {
        return await this.callOpenAI(prompt, options);
      } else if (this.provider === 'anthropic' && this.apiKey) {
        return await this.callAnthropic(prompt, options);
      }
    } catch (error) {
      console.warn('AI API call failed, using fallback logic:', error);
    }

    // Fallback to rule-based logic
    return this.fallbackLogic(prompt);
  }

  private async callHuggingFace(prompt: string, options: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: options.temperature || 0.7,
          max_new_tokens: options.maxTokens || 1000,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || '';
  }

  private async callOpenAI(prompt: string, options: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callAnthropic(prompt: string, options: { temperature?: number; maxTokens?: number }): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  private fallbackLogic(prompt: string): string {
    // Simple rule-based responses for common queries
    if (prompt.includes('roadmap') || prompt.includes('learning path')) {
      return JSON.stringify({
        steps: [
          { title: 'Fundamentals', duration: '4-6 weeks', concepts: ['Basics', 'Core concepts'] },
          { title: 'Intermediate Topics', duration: '6-8 weeks', concepts: ['Advanced patterns', 'Best practices'] },
          { title: 'Advanced Skills', duration: '8-12 weeks', concepts: ['Architecture', 'Optimization'] },
        ],
      });
    }
    return 'Fallback response - please configure AI API for better results';
  }

  /**
   * Analyze uploaded PDF roadmap
   */
  async analyzeRoadmap(content: string, userGoals: string[]): Promise<{
    analysis: string;
    suggestions: string[];
    improvements: string[];
    estimatedTime: string;
  }> {
    const prompt = `Analyze this learning roadmap and provide suggestions for improvement.

User Goals: ${userGoals.join(', ')}

Roadmap Content:
${content.substring(0, 2000)}

Provide:
1. Overall analysis
2. Specific suggestions for improvement
3. Missing topics or skills
4. Estimated time to complete

Format as JSON with keys: analysis, suggestions, improvements, estimatedTime`;

    const response = await this.callAI(prompt, { temperature: 0.7, maxTokens: 1500 });

    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // Fallback analysis
      return {
        analysis: 'Your roadmap covers the essential topics. Consider adding more hands-on projects and real-world applications.',
        suggestions: [
          'Add more practical projects between theory sections',
          'Include time estimates for each section',
          'Add prerequisites for advanced topics',
        ],
        improvements: [
          'Break down large topics into smaller milestones',
          'Add resources for each learning section',
          'Include assessment checkpoints',
        ],
        estimatedTime: '6-12 months depending on weekly commitment',
      };
    }
  }

  /**
   * Analyze uploaded resume
   */
  async analyzeResume(content: string): Promise<{
    extractedSkills: string[];
    experience: string;
    suggestions: string[];
    strengths: string[];
    gaps: string[];
  }> {
    const prompt = `Analyze this resume and extract key information.

Resume Content:
${content.substring(0, 2000)}

Provide:
1. List of technical skills
2. Experience level (beginner/intermediate/advanced)
3. Suggestions for improvement
4. Strengths
5. Skill gaps for target roles

Format as JSON with keys: extractedSkills (array), experience (string), suggestions (array), strengths (array), gaps (array)`;

    const response = await this.callAI(prompt, { temperature: 0.5, maxTokens: 1500 });

    try {
      const parsed = JSON.parse(response);
      return parsed;
    } catch {
      // Fallback analysis
      return {
        extractedSkills: this.extractSkillsFromText(content),
        experience: 'intermediate',
        suggestions: [
          'Add quantifiable achievements',
          'Include more technical details about projects',
          'Highlight impact and results',
        ],
        strengths: ['Good project variety', 'Clear structure'],
        gaps: ['Missing modern frameworks', 'Limited cloud experience'],
      };
    }
  }

  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
      'HTML', 'CSS', 'SQL', 'Git', 'Docker', 'AWS', 'Azure',
      'MongoDB', 'PostgreSQL', 'REST API', 'GraphQL', 'Testing',
    ];

    return commonSkills.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }

  /**
   * Generate roadmap with AI
   */
  async generateRoadmap(profile: UserProfile): Promise<RoadmapStep[]> {
    const { primaryGoals, secondaryGoals, skills, experienceLevel, learningStyle } = profile;

    const prompt = `Create a personalized learning roadmap for:

Primary Goals: ${primaryGoals.join(', ')}
Secondary Goals: ${secondaryGoals.join(', ')}
Current Skills: ${skills.join(', ')}
Experience Level: ${experienceLevel}
Learning Style: ${learningStyle}

Generate a structured roadmap with 5-8 steps. Each step should include:
- Title
- Description
- Estimated hours
- Skills to learn
- Key concepts
- Prerequisites

Focus on progressive difficulty and building confidence. Format as JSON array.`;

    const response = await this.callAI(prompt, { temperature: 0.7, maxTokens: 2000 });

    try {
      const steps = JSON.parse(response);
      return this.formatRoadmapSteps(steps);
    } catch {
      // Fallback to template-based roadmap
      return this.generateFallbackRoadmap(profile);
    }
  }

  private formatRoadmapSteps(rawSteps: any[]): RoadmapStep[] {
    return rawSteps.map((step, index) => ({
      id: `step-${Date.now()}-${index}`,
      title: step.title || `Step ${index + 1}`,
      description: step.description || '',
      estimatedHours: step.estimatedHours || step.hours || 20,
      skills: Array.isArray(step.skills) ? step.skills : [],
      concepts: Array.isArray(step.concepts) ? step.concepts : [],
      prerequisites: Array.isArray(step.prerequisites) ? step.prerequisites : [],
      resources: [],
      completed: false,
      order: index + 1,
    }));
  }

  private generateFallbackRoadmap(profile: UserProfile): RoadmapStep[] {
    const mainGoal = profile.primaryGoals[0] || 'Software Developer';
    const level = profile.experienceLevel;

    const templates: Record<string, RoadmapStep[]> = {
      'Data Analyst': [
        {
          id: 'step-1',
          title: 'Excel & Data Fundamentals',
          description: 'Master data manipulation, formulas, pivot tables, and basic analysis',
          estimatedHours: 30,
          skills: ['Excel', 'Data Cleaning', 'Formulas', 'Pivot Tables'],
          concepts: ['Data types', 'Statistical basics', 'Data visualization'],
          prerequisites: [],
          resources: [],
          completed: false,
          order: 1,
        },
        {
          id: 'step-2',
          title: 'SQL for Data Analysis',
          description: 'Learn to query databases and extract insights from data',
          estimatedHours: 40,
          skills: ['SQL', 'Database Queries', 'Joins', 'Aggregations'],
          concepts: ['Relational databases', 'Query optimization', 'Data modeling'],
          prerequisites: ['Data Fundamentals'],
          resources: [],
          completed: false,
          order: 2,
        },
        {
          id: 'step-3',
          title: 'Python for Data Analysis',
          description: 'Use Python, Pandas, and NumPy for advanced data manipulation',
          estimatedHours: 50,
          skills: ['Python', 'Pandas', 'NumPy', 'Data Wrangling'],
          concepts: ['Programming basics', 'Data structures', 'Libraries'],
          prerequisites: ['SQL'],
          resources: [],
          completed: false,
          order: 3,
        },
        {
          id: 'step-4',
          title: 'Data Visualization',
          description: 'Create compelling visualizations with Tableau, Power BI, or Matplotlib',
          estimatedHours: 35,
          skills: ['Tableau', 'Power BI', 'Matplotlib', 'Storytelling'],
          concepts: ['Chart types', 'Dashboard design', 'Visual best practices'],
          prerequisites: ['Python'],
          resources: [],
          completed: false,
          order: 4,
        },
        {
          id: 'step-5',
          title: 'Statistics & A/B Testing',
          description: 'Apply statistical methods and hypothesis testing',
          estimatedHours: 45,
          skills: ['Statistics', 'Hypothesis Testing', 'A/B Testing', 'Probability'],
          concepts: ['Statistical significance', 'Confidence intervals', 'Experimental design'],
          prerequisites: ['Data Analysis'],
          resources: [],
          completed: false,
          order: 5,
        },
      ],
      'Frontend Developer': [
        {
          id: 'step-1',
          title: 'HTML & CSS Mastery',
          description: 'Build responsive, accessible web layouts',
          estimatedHours: 40,
          skills: ['HTML5', 'CSS3', 'Flexbox', 'Grid', 'Responsive Design'],
          concepts: ['Semantic HTML', 'CSS specificity', 'Mobile-first design'],
          prerequisites: [],
          resources: [],
          completed: false,
          order: 1,
        },
        {
          id: 'step-2',
          title: 'JavaScript Fundamentals',
          description: 'Master modern JavaScript and ES6+ features',
          estimatedHours: 60,
          skills: ['JavaScript', 'ES6+', 'DOM', 'Async/Await', 'Fetch API'],
          concepts: ['Variables & scope', 'Functions', 'Promises', 'Event handling'],
          prerequisites: ['HTML & CSS'],
          resources: [],
          completed: false,
          order: 2,
        },
        {
          id: 'step-3',
          title: 'React Framework',
          description: 'Build interactive UIs with React and hooks',
          estimatedHours: 70,
          skills: ['React', 'JSX', 'Hooks', 'Components', 'State Management'],
          concepts: ['Component lifecycle', 'Props vs State', 'Context API'],
          prerequisites: ['JavaScript'],
          resources: [],
          completed: false,
          order: 3,
        },
        {
          id: 'step-4',
          title: 'Advanced React & Next.js',
          description: 'Server-side rendering, routing, and optimization',
          estimatedHours: 50,
          skills: ['Next.js', 'SSR', 'Routing', 'API Routes', 'Performance'],
          concepts: ['Hydration', 'Code splitting', 'SEO optimization'],
          prerequisites: ['React'],
          resources: [],
          completed: false,
          order: 4,
        },
      ],
    };

    const roadmap = templates[mainGoal] || templates['Frontend Developer'];

    // Filter based on existing skills
    return roadmap.filter(step => {
      const hasAllSkills = step.skills.every(skill =>
        profile.skills.some(userSkill =>
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      return !hasAllSkills;
    });
  }

  /**
   * Generate progressive project ideas
   */
  async generateProjectIdeas(
    completedSkills: string[],
    experienceLevel: 'beginner' | 'intermediate' | 'advanced',
    goals: string[]
  ): Promise<ProjectIdea[]> {
    const prompt = `Generate 5 progressive project ideas for:

Skills: ${completedSkills.join(', ')}
Level: ${experienceLevel}
Goals: ${goals.join(', ')}

Each project should:
1. Build on previous concepts
2. Introduce new skills gradually
3. Boost confidence through achievable milestones
4. Have real-world applications
5. Be relevant to career goals

Format as JSON array with: title, description, difficulty, skills, concepts, estimatedHours, jobRelevance (1-10), confidenceBoost (1-10), realWorldApplication, milestones (array)`;

    const response = await this.callAI(prompt, { temperature: 0.8, maxTokens: 2000 });

    try {
      const projects = JSON.parse(response);
      return this.formatProjectIdeas(projects);
    } catch {
      return this.generateFallbackProjects(completedSkills, experienceLevel, goals);
    }
  }

  private formatProjectIdeas(rawProjects: any[]): ProjectIdea[] {
    return rawProjects.map((proj, index) => ({
      id: `proj-${Date.now()}-${index}`,
      title: proj.title || `Project ${index + 1}`,
      description: proj.description || '',
      difficulty: proj.difficulty || 'beginner',
      skills: Array.isArray(proj.skills) ? proj.skills : [],
      concepts: Array.isArray(proj.concepts) ? proj.concepts : [],
      estimatedHours: proj.estimatedHours || 20,
      jobRelevance: proj.jobRelevance || 7,
      confidenceBoost: proj.confidenceBoost || 7,
      realWorldApplication: proj.realWorldApplication || 'Practical skill development',
      milestones: Array.isArray(proj.milestones) ? proj.milestones : [],
    }));
  }

  private generateFallbackProjects(
    skills: string[],
    level: 'beginner' | 'intermediate' | 'advanced',
    goals: string[]
  ): ProjectIdea[] {
    const allProjects: ProjectIdea[] = [
      // Beginner Projects
      {
        id: 'proj-1',
        title: 'Personal Portfolio Website',
        description: 'Create a responsive portfolio to showcase your work and skills',
        difficulty: 'beginner',
        skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
        concepts: ['Layout', 'Styling', 'Basic interactivity'],
        estimatedHours: 15,
        jobRelevance: 8,
        confidenceBoost: 9,
        realWorldApplication: 'Essential for job applications and personal branding',
        milestones: [
          'Create HTML structure',
          'Style with CSS',
          'Add responsive design',
          'Deploy to web',
        ],
      },
      {
        id: 'proj-2',
        title: 'Todo List App',
        description: 'Build a full-featured task management application',
        difficulty: 'beginner',
        skills: ['JavaScript', 'DOM Manipulation', 'Local Storage', 'Event Handling'],
        concepts: ['CRUD operations', 'State management', 'Data persistence'],
        estimatedHours: 12,
        jobRelevance: 7,
        confidenceBoost: 8,
        realWorldApplication: 'Learn fundamental app development patterns',
        milestones: [
          'Create UI',
          'Add/delete tasks',
          'Mark complete',
          'Save to localStorage',
        ],
      },
      // Intermediate Projects
      {
        id: 'proj-3',
        title: 'Weather Dashboard',
        description: 'Fetch and display weather data from an API with charts',
        difficulty: 'intermediate',
        skills: ['API Integration', 'Async JavaScript', 'Data Visualization', 'React'],
        concepts: ['API calls', 'Error handling', 'State management', 'Charts'],
        estimatedHours: 25,
        jobRelevance: 9,
        confidenceBoost: 8,
        realWorldApplication: 'Learn to work with external APIs and display data',
        milestones: [
          'Set up React app',
          'Integrate weather API',
          'Display current weather',
          'Add 7-day forecast',
          'Create charts',
        ],
      },
      {
        id: 'proj-4',
        title: 'E-commerce Product Page',
        description: 'Build a dynamic product page with cart and checkout',
        difficulty: 'intermediate',
        skills: ['React', 'State Management', 'Forms', 'Validation', 'Context API'],
        concepts: ['Component composition', 'Form handling', 'Shopping cart logic'],
        estimatedHours: 30,
        jobRelevance: 10,
        confidenceBoost: 9,
        realWorldApplication: 'E-commerce is a huge industry - highly relevant skills',
        milestones: [
          'Product display',
          'Add to cart',
          'Cart management',
          'Checkout form',
          'Order summary',
        ],
      },
      // Advanced Projects
      {
        id: 'proj-5',
        title: 'Full-Stack Blog Platform',
        description: 'Create a complete blog with authentication, CMS, and comments',
        difficulty: 'advanced',
        skills: ['React', 'Node.js', 'Database', 'Authentication', 'REST API'],
        concepts: ['Full-stack architecture', 'Security', 'Database design', 'API design'],
        estimatedHours: 60,
        jobRelevance: 10,
        confidenceBoost: 10,
        realWorldApplication: 'Demonstrates end-to-end development skills',
        milestones: [
          'Set up backend API',
          'Database schema',
          'User authentication',
          'Create/edit posts',
          'Comments system',
          'Deploy full stack',
        ],
      },
      {
        id: 'proj-6',
        title: 'Real-Time Chat Application',
        description: 'Build a chat app with WebSockets, rooms, and notifications',
        difficulty: 'advanced',
        skills: ['WebSockets', 'Real-time', 'Node.js', 'React', 'Database'],
        concepts: ['Real-time communication', 'Event-driven architecture', 'Scalability'],
        estimatedHours: 50,
        jobRelevance: 9,
        confidenceBoost: 10,
        realWorldApplication: 'Real-time features are in high demand',
        milestones: [
          'WebSocket setup',
          'User authentication',
          'Chat rooms',
          'Private messages',
          'Notifications',
          'Message history',
        ],
      },
    ];

    // Filter by level and skills
    const levelMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const userLevel = levelMap[level];

    return allProjects
      .filter(proj => {
        const projLevel = levelMap[proj.difficulty];
        return projLevel >= userLevel - 1 && projLevel <= userLevel + 1;
      })
      .filter(proj => {
        // Match at least 40% of required skills
        const matchingSkills = proj.skills.filter(skill =>
          skills.some(userSkill =>
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
          )
        );
        return matchingSkills.length >= proj.skills.length * 0.4;
      })
      .sort((a, b) => {
        // Sort by relevance and confidence boost
        return (b.jobRelevance + b.confidenceBoost) - (a.jobRelevance + a.confidenceBoost);
      })
      .slice(0, 5);
  }

  /**
   * Match jobs intelligently
   */
  async matchJobs(
    userSkills: string[],
    goals: string[],
    completedProjects: number,
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<JobMatch[]> {
    // Get job listings (in real app, this would be from a job API)
    const jobListings = this.getJobListings(goals);

    return jobListings
      .map(job => {
        const matchingSkills = job.requiredSkills.filter(skill =>
          userSkills.some(us =>
            us.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(us.toLowerCase())
          )
        );

        const missingSkills = job.requiredSkills.filter(skill =>
          !userSkills.some(us =>
            us.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(us.toLowerCase())
          )
        );

        const skillMatchScore = matchingSkills.length / job.requiredSkills.length;
        const projectBonus = Math.min(completedProjects * 0.08, 0.25);
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
      .slice(0, 15);
  }

  private getJobListings(goals: string[]): JobMatch[] {
    const mainGoal = goals[0] || 'Developer';

    const jobsByRole: Record<string, JobMatch[]> = {
      'Data Analyst': [
        {
          id: 'job-1',
          title: 'Junior Data Analyst',
          company: 'Tech Startup',
          matchScore: 0,
          requiredSkills: ['Excel', 'SQL', 'Data Visualization', 'Python'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$55k - $70k',
          location: 'Remote',
          type: 'full-time',
        },
        {
          id: 'job-2',
          title: 'Data Analyst',
          company: 'E-commerce Company',
          matchScore: 0,
          requiredSkills: ['SQL', 'Python', 'Tableau', 'Statistics', 'A/B Testing'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$70k - $90k',
          location: 'Hybrid',
          type: 'full-time',
        },
        {
          id: 'job-3',
          title: 'Business Intelligence Analyst',
          company: 'Financial Services',
          matchScore: 0,
          requiredSkills: ['SQL', 'Power BI', 'Excel', 'Data Modeling', 'ETL'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$75k - $95k',
          location: 'On-site',
          type: 'full-time',
        },
        {
          id: 'job-4',
          title: 'Customer Service Representative',
          company: 'Age Care Facility',
          matchScore: 0,
          requiredSkills: ['Communication', 'Empathy', 'Problem Solving', 'Computer Skills'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$35k - $45k',
          location: 'On-site',
          type: 'part-time',
        },
        {
          id: 'job-5',
          title: 'Support Worker',
          company: 'Community Care Services',
          matchScore: 0,
          requiredSkills: ['Care Skills', 'Communication', 'First Aid', 'Documentation'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$25 - $35/hour',
          location: 'On-site',
          type: 'part-time',
        },
      ],
      'Frontend Developer': [
        {
          id: 'job-1',
          title: 'Junior Frontend Developer',
          company: 'Tech Startup',
          matchScore: 0,
          requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$60k - $80k',
          location: 'Remote',
          type: 'full-time',
        },
        {
          id: 'job-2',
          title: 'Frontend Developer',
          company: 'Digital Agency',
          matchScore: 0,
          requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Git'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$80k - $100k',
          location: 'Hybrid',
          type: 'full-time',
        },
        {
          id: 'job-3',
          title: 'UI Developer',
          company: 'SaaS Company',
          matchScore: 0,
          requiredSkills: ['React', 'CSS', 'Responsive Design', 'Accessibility', 'Testing'],
          missingSkills: [],
          readinessLevel: 0,
          salary: '$75k - $95k',
          location: 'Remote',
          type: 'full-time',
        },
      ],
    };

    return jobsByRole[mainGoal] || jobsByRole['Frontend Developer'];
  }

  private calculateReadiness(
    matchScore: number,
    level: string,
    projects: number
  ): number {
    let readiness = matchScore;

    if (level === 'beginner') readiness *= 0.75;
    if (level === 'advanced') readiness *= 1.15;

    readiness += Math.min(projects * 4, 20);

    return Math.min(Math.round(readiness), 100);
  }

  /**
   * Build dynamic resume
   */
  async buildResume(
    profile: UserProfile,
    completedSkills: string[],
    completedProjects: Array<{ title: string; description: string; skills: string[] }>
  ): Promise<ResumeSection> {
    const prompt = `Generate a professional resume summary and achievements for:

Goals: ${profile.primaryGoals.join(', ')}
Skills: ${completedSkills.join(', ')}
Experience Level: ${profile.experienceLevel}
Projects: ${completedProjects.length}

Create:
1. Professional summary (2-3 sentences)
2. Key achievements (3-5 bullet points)

Format as JSON with keys: summary, achievements (array)`;

    const response = await this.callAI(prompt, { temperature: 0.7, maxTokens: 800 });

    let summary = '';
    let achievements: string[] = [];

    try {
      const parsed = JSON.parse(response);
      summary = parsed.summary;
      achievements = parsed.achievements;
    } catch {
      // Fallback
      summary = this.generateSummary(profile, completedSkills);
      achievements = this.generateAchievements(completedSkills.length, completedProjects.length);
    }

    const projects = completedProjects.map(project => ({
      title: project.title,
      description: project.description,
      technologies: project.skills,
      impact: 'Demonstrated practical application of learned skills',
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
      achievements,
    };
  }

  private generateSummary(profile: UserProfile, skills: string[]): string {
    const { primaryGoals, experienceLevel } = profile;
    const level = experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1);
    const goal = primaryGoals[0] || 'Developer';

    return `${level} ${goal} with ${skills.length} technical skills and a passion for continuous learning. Experienced in modern development practices with a focus on building quality, user-centric solutions.`;
  }

  private generateAchievements(skillCount: number, projectCount: number): string[] {
    return [
      `Mastered ${skillCount} technical skills through structured learning`,
      `Completed ${projectCount} hands-on projects demonstrating practical expertise`,
      'Applied best practices in code quality, testing, and documentation',
      'Demonstrated ability to learn and adapt to new technologies quickly',
    ];
  }

  private generateExperienceStatement(
    level: string,
    skillCount: number,
    projectCount: number
  ): string {
    return `Completed ${projectCount} projects demonstrating proficiency in ${skillCount} technologies. ${
      level === 'advanced' ? 'Experienced in' : 'Developing expertise in'
    } modern development practices and industry standards.`;
  }

  /**
   * Generate roadmap suggestions
   */
  generateRoadmapSuggestions(
    roadmap: RoadmapStep[],
    profile: UserProfile,
    completedSteps: string[]
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const completionRate = completedSteps.length / roadmap.length;

    // Suggest adding advanced topics if progressing well
    if (completionRate > 0.6 && profile.experienceLevel !== 'beginner') {
      suggestions.push({
        id: `suggest-${Date.now()}-1`,
        type: 'add',
        reason: 'You\'re making excellent progress! Consider adding advanced topics to accelerate your growth.',
        data: { topics: ['System Design', 'Performance Optimization', 'Advanced Patterns'] },
        confidence: 0.85,
      });
    }

    // Suggest reordering if struggling
    const recentSteps = roadmap.slice(-3);
    if (recentSteps.every(s => !completedSteps.includes(s.id))) {
      suggestions.push({
        id: `suggest-${Date.now()}-2`,
        type: 'reorder',
        reason: 'Consider tackling easier topics first to build momentum and confidence.',
        data: { strategy: 'difficulty-ascending' },
        confidence: 0.75,
      });
    }

    return suggestions;
  }

  /**
   * Assess readiness to move on
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

    const isReady = questionsAnswered >= minimumQuestions && accuracy >= targetAccuracy;

    let recommendation = '';
    const nextSteps: string[] = [];

    if (isReady) {
      recommendation = `Excellent work! You've mastered ${skill}. Ready to advance.`;
      nextSteps.push('Move to next topic');
      nextSteps.push('Try a practice project');
      nextSteps.push('Review advanced concepts');
    } else if (accuracy < targetAccuracy) {
      recommendation = `Keep practicing ${skill}. Aim for ${Math.round(targetAccuracy * 100)}% accuracy.`;
      nextSteps.push('Review key concepts');
      nextSteps.push('Try more practice questions');
      nextSteps.push('Watch tutorial videos');
    } else {
      recommendation = `You're doing well! Complete ${minimumQuestions - questionsAnswered} more questions.`;
      nextSteps.push('Continue practicing');
      nextSteps.push('Focus on weak areas');
    }

    return {
      isReady,
      confidence: accuracy,
      recommendation,
      nextSteps,
    };
  }

  /**
   * Generate practice questions
   */
  generatePracticeQuestions(
    skill: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number
  ): PracticeQuestion[] {
    // Mock questions - in production, use AI to generate
    const questions: PracticeQuestion[] = [
      {
        id: 'q1',
        question: `What is the primary use case for ${skill}?`,
        options: [
          'Building user interfaces',
          'Managing databases',
          'Server-side logic',
          'All of the above',
        ],
        correctAnswer: 0,
        explanation: `${skill} is primarily used for building user interfaces.`,
        difficulty,
        skill,
        concept: 'Fundamentals',
      },
    ];

    return questions.slice(0, count);
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
   * Search for learning resources using AI
   */
  async searchResources(
    topic: string,
    learningStyle: string,
    difficulty: string
  ): Promise<Resource[]> {
    // In production, integrate with real resource APIs
    // For now, return curated resources
    return [
      {
        id: 'res-1',
        title: `${topic} - Complete Guide`,
        type: 'course',
        url: `https://www.freecodecamp.org/learn`,
        duration: '10 hours',
        difficulty: difficulty as any,
        provider: 'freeCodeCamp',
        rating: 4.8,
        isFree: true,
      },
      {
        id: 'res-2',
        title: `${topic} Documentation`,
        type: 'documentation',
        url: `https://developer.mozilla.org`,
        duration: 'Self-paced',
        difficulty: difficulty as any,
        provider: 'MDN',
        rating: 4.9,
        isFree: true,
      },
    ];
  }
}

// Export singleton instance
export const aiService = new AIService();

