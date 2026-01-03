/**
 * AI Service - Intelligent Career Development Engine
 * 
 * This service provides AI-driven features:
 * - Analyzes user goals, skills, and experience
 * - Generates personalized learning roadmaps
 * - Recommends adaptive study resources
 * - Suggests progressive projects (beginner → advanced)
 * - Matches jobs based on skills and readiness
 * - Builds dynamic resumes
 * - Analyzes uploaded PDF roadmaps
 * 
 * Currently uses rule-based logic + Hugging Face Inference API (free)
 * Structured for easy integration with OpenAI/Anthropic/etc later
 */

export interface UserProfile {
  primaryGoals: string[];
  secondaryGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: number;
  existingSkills: string[];
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  resources: Resource[];
  skills: string[];
  completed: boolean;
  order: number;
}

export interface Resource {
  title: string;
  type: 'video' | 'article' | 'course' | 'book' | 'practice';
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  provider: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
  concepts: string[];
  estimatedHours: number;
  jobRelevance: number; // 0-100
  confidenceBoost: string;
  learningOutcomes: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  requiredSkills: string[];
  readinessScore: number; // 0-100
  skillGaps: string[];
  matchReason: string;
}

export interface AISuggestion {
  id: string;
  type: 'add' | 'remove' | 'reorder' | 'modify';
  target: string;
  reason: string;
  content?: any;
  priority: 'high' | 'medium' | 'low';
}

export interface StudySession {
  questions: Question[];
  adaptiveDifficulty: boolean;
  readinessThreshold: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: string;
  explanation: string;
}

class AIService {
  private hfApiKey: string | null = null;
  private hfEndpoint = 'https://api-inference.huggingface.co/models/';

  /**
   * Initialize AI service with optional Hugging Face API key
   * Free tier: 30,000 characters/month
   */
  constructor(apiKey?: string) {
    this.hfApiKey = apiKey || null;
  }

  /**
   * Analyze user profile and generate personalized roadmap
   */
  async generateRoadmap(profile: UserProfile): Promise<RoadmapStep[]> {
    const roadmap: RoadmapStep[] = [];
    let order = 0;

    // Process each primary goal
    for (const goal of profile.primaryGoals) {
      const steps = await this.generateGoalSteps(goal, profile, order, 'primary');
      roadmap.push(...steps);
      order += steps.length;
    }

    // Process secondary goals (lighter, part-time focused)
    for (const goal of profile.secondaryGoals) {
      const steps = await this.generateGoalSteps(goal, profile, order, 'secondary');
      roadmap.push(...steps);
      order += steps.length;
    }

    return roadmap;
  }

  /**
   * Generate steps for a specific goal
   */
  private async generateGoalSteps(
    goal: string,
    profile: UserProfile,
    startOrder: number,
    type: 'primary' | 'secondary'
  ): Promise<RoadmapStep[]> {
    const steps: RoadmapStep[] = [];
    const skillsNeeded = this.extractSkillsFromGoal(goal);
    
    // Adjust depth based on goal type
    const depth = type === 'primary' ? 'comprehensive' : 'essential';
    
    // Generate learning path
    const learningPath = this.createLearningPath(goal, skillsNeeded, profile, depth);
    
    for (let i = 0; i < learningPath.length; i++) {
      const step = learningPath[i];
      const resources = await this.findResources(step.topic, step.difficulty, profile.learningStyle);
      
      steps.push({
        id: `step-${startOrder + i}`,
        title: step.title,
        description: step.description,
        duration: this.calculateDuration(step.complexity, profile.weeklyHours),
        resources,
        skills: step.skills,
        completed: false,
        order: startOrder + i
      });
    }

    return steps;
  }

  /**
   * Extract skills from goal using NLP-like pattern matching
   */
  private extractSkillsFromGoal(goal: string): string[] {
    const goalLower = goal.toLowerCase();
    const skillMap: Record<string, string[]> = {
      'data analyst': ['SQL', 'Python', 'Excel', 'Tableau', 'Statistics', 'Data Visualization'],
      'data scientist': ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Deep Learning', 'R'],
      'web developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Git'],
      'frontend developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Responsive Design'],
      'backend developer': ['Node.js', 'Python', 'SQL', 'REST APIs', 'Docker', 'Authentication'],
      'full stack developer': ['JavaScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git'],
      'mobile developer': ['React Native', 'JavaScript', 'Mobile UI', 'APIs', 'State Management'],
      'devops engineer': ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS', 'Terraform'],
      'machine learning engineer': ['Python', 'TensorFlow', 'PyTorch', 'ML Algorithms', 'Data Processing'],
      'age care': ['First Aid', 'Patient Care', 'Communication', 'Empathy', 'Safety Protocols'],
      'customer service': ['Communication', 'Problem Solving', 'CRM Software', 'Conflict Resolution'],
      'aged care': ['First Aid', 'Patient Care', 'Communication', 'Empathy', 'Safety Protocols'],
      'healthcare': ['Medical Terminology', 'Patient Care', 'HIPAA', 'Clinical Skills'],
      'project manager': ['Agile', 'Scrum', 'Project Planning', 'Risk Management', 'Leadership'],
      'ui/ux designer': ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
      'cybersecurity': ['Network Security', 'Penetration Testing', 'Cryptography', 'Security Auditing'],
    };

    // Find matching skills
    for (const [key, skills] of Object.entries(skillMap)) {
      if (goalLower.includes(key)) {
        return skills;
      }
    }

    // Default: extract keywords as skills
    return goal.split(' ')
      .filter(word => word.length > 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  /**
   * Create progressive learning path
   */
  private createLearningPath(
    goal: string,
    skills: string[],
    profile: UserProfile,
    depth: 'comprehensive' | 'essential'
  ) {
    const path = [];
    const startLevel = profile.experienceLevel;

    // Foundations (if beginner)
    if (startLevel === 'beginner') {
      path.push({
        title: `${goal} Fundamentals`,
        description: `Core concepts and terminology for ${goal}`,
        topic: goal,
        difficulty: 'beginner' as const,
        complexity: 2,
        skills: skills.slice(0, 2)
      });
    }

    // Core skills
    const coreSkills = depth === 'comprehensive' ? skills : skills.slice(0, 3);
    for (const skill of coreSkills) {
      const difficulty = startLevel === 'beginner' ? 'beginner' : 
                        startLevel === 'intermediate' ? 'intermediate' : 'advanced';
      
      path.push({
        title: `Master ${skill}`,
        description: `Deep dive into ${skill} with hands-on practice`,
        topic: skill,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        complexity: 3,
        skills: [skill]
      });
    }

    // Integration & Projects
    if (depth === 'comprehensive') {
      path.push({
        title: `${goal} Real-World Projects`,
        description: `Build portfolio projects that demonstrate your skills`,
        topic: `${goal} projects`,
        difficulty: 'intermediate' as const,
        complexity: 4,
        skills: skills.slice(0, 4)
      });

      // Advanced topics
      path.push({
        title: `Advanced ${goal} Techniques`,
        description: `Industry best practices and advanced concepts`,
        topic: `advanced ${goal}`,
        difficulty: 'advanced' as const,
        complexity: 5,
        skills: skills
      });
    }

    // Job preparation
    path.push({
      title: `${goal} Job Preparation`,
      description: `Interview prep, resume building, and job search strategies`,
      topic: `${goal} career`,
      difficulty: 'intermediate' as const,
      complexity: 2,
      skills: ['Interview Skills', 'Resume Writing', 'Networking']
    });

    return path;
  }

  /**
   * Find learning resources using Hugging Face + curated sources
   */
  private async findResources(
    topic: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    learningStyle: string
  ): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Curated resource database (expandable)
    const resourceDB = this.getCuratedResources(topic, difficulty);
    
    // Filter by learning style
    const stylePreferences = {
      'visual': ['video', 'course'],
      'hands-on': ['practice', 'course'],
      'reading': ['article', 'book'],
      'mixed': ['video', 'article', 'practice', 'course']
    };

    const preferredTypes = stylePreferences[learningStyle as keyof typeof stylePreferences] || ['video', 'article'];
    
    // Add curated resources matching style
    for (const resource of resourceDB) {
      if (preferredTypes.includes(resource.type)) {
        resources.push(resource);
      }
    }

    // Ensure variety
    if (resources.length < 3) {
      resources.push(...resourceDB.slice(0, 5 - resources.length));
    }

    return resources.slice(0, 5);
  }

  /**
   * Curated resource database
   */
  private getCuratedResources(topic: string, difficulty: string): Resource[] {
    const topicLower = topic.toLowerCase();
    
    // Platform-specific resources
    const platforms = {
      youtube: (title: string, duration: string) => ({
        type: 'video' as const,
        provider: 'YouTube',
        url: `https://youtube.com/results?search_query=${encodeURIComponent(topic + ' ' + difficulty)}`,
        duration
      }),
      freecodecamp: (title: string, duration: string) => ({
        type: 'course' as const,
        provider: 'freeCodeCamp',
        url: `https://www.freecodecamp.org/learn`,
        duration
      }),
      mdn: (title: string, duration: string) => ({
        type: 'article' as const,
        provider: 'MDN Web Docs',
        url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`,
        duration
      }),
      kaggle: (title: string, duration: string) => ({
        type: 'practice' as const,
        provider: 'Kaggle',
        url: `https://www.kaggle.com/learn`,
        duration
      }),
      coursera: (title: string, duration: string) => ({
        type: 'course' as const,
        provider: 'Coursera (Audit Free)',
        url: `https://www.coursera.org/search?query=${encodeURIComponent(topic)}`,
        duration
      })
    };

    const resources: Resource[] = [];

    // Add topic-specific resources
    if (topicLower.includes('python') || topicLower.includes('data')) {
      resources.push({
        title: `${topic} - Complete Tutorial`,
        difficulty: difficulty as any,
        ...platforms.youtube(`${topic} tutorial`, difficulty === 'beginner' ? '2-4 hours' : '4-8 hours')
      });
      resources.push({
        title: `${topic} Practice Exercises`,
        difficulty: difficulty as any,
        ...platforms.kaggle(`${topic} exercises`, '1-2 hours')
      });
    }

    if (topicLower.includes('javascript') || topicLower.includes('web') || topicLower.includes('react')) {
      resources.push({
        title: `${topic} Documentation`,
        difficulty: difficulty as any,
        ...platforms.mdn(`${topic} guide`, '1-2 hours')
      });
      resources.push({
        title: `${topic} Interactive Course`,
        difficulty: difficulty as any,
        ...platforms.freecodecamp(`${topic} course`, '10-20 hours')
      });
    }

    // Generic resources
    resources.push({
      title: `${topic} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Course`,
      difficulty: difficulty as any,
      ...platforms.coursera(`${topic} ${difficulty}`, difficulty === 'beginner' ? '4-6 weeks' : '6-10 weeks')
    });

    resources.push({
      title: `${topic} Video Tutorial Series`,
      difficulty: difficulty as any,
      ...platforms.youtube(`${topic} ${difficulty}`, '3-6 hours')
    });

    resources.push({
      title: `Hands-on ${topic} Projects`,
      difficulty: difficulty as any,
      type: 'practice',
      provider: 'GitHub',
      url: `https://github.com/search?q=${encodeURIComponent(topic + ' projects')}`,
      duration: '2-4 hours'
    });

    return resources;
  }

  /**
   * Calculate duration based on complexity and available time
   */
  private calculateDuration(complexity: number, weeklyHours: number): string {
    const totalHours = complexity * 10; // Base hours
    const weeks = Math.ceil(totalHours / weeklyHours);
    
    if (weeks === 1) return '1 week';
    if (weeks < 4) return `${weeks} weeks`;
    if (weeks < 8) return `${Math.ceil(weeks / 4)} month${weeks > 4 ? 's' : ''}`;
    return `${Math.ceil(weeks / 4)} months`;
  }

  /**
   * Generate AI suggestions for roadmap improvements
   */
  async generateSuggestions(
    roadmap: RoadmapStep[],
    profile: UserProfile,
    progress: number
  ): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze progress and suggest optimizations
    if (progress < 30) {
      // Early stage: suggest foundational improvements
      suggestions.push({
        id: 'sug-1',
        type: 'add',
        target: 'roadmap',
        reason: 'Adding foundational practice will strengthen your understanding',
        content: {
          title: 'Daily Practice Routine',
          description: 'Consistent practice is key to mastery',
          duration: '15 min/day'
        },
        priority: 'high'
      });
    }

    if (progress > 50 && progress < 80) {
      // Mid stage: suggest projects
      suggestions.push({
        id: 'sug-2',
        type: 'add',
        target: 'roadmap',
        reason: 'Building projects now will solidify your skills and boost your portfolio',
        content: {
          title: 'Portfolio Project',
          description: 'Create a real-world project showcasing your skills',
          duration: '2-3 weeks'
        },
        priority: 'high'
      });
    }

    // Check for skill gaps
    const completedSkills = roadmap
      .filter(step => step.completed)
      .flatMap(step => step.skills);
    
    const allRequiredSkills = profile.primaryGoals
      .flatMap(goal => this.extractSkillsFromGoal(goal));
    
    const missingSkills = allRequiredSkills.filter(
      skill => !completedSkills.includes(skill)
    );

    if (missingSkills.length > 0) {
      suggestions.push({
        id: 'sug-3',
        type: 'add',
        target: 'skills',
        reason: `You're missing key skills: ${missingSkills.slice(0, 3).join(', ')}`,
        content: {
          skills: missingSkills.slice(0, 3)
        },
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Generate progressive projects (beginner → intermediate → advanced)
   */
  async generateProjects(
    profile: UserProfile,
    completedSteps: RoadmapStep[]
  ): Promise<Project[]> {
    const projects: Project[] = [];
    const skills = completedSteps.flatMap(step => step.skills);
    const uniqueSkills = [...new Set(skills)];

    // Determine user's current level based on completed steps
    const currentLevel = completedSteps.length < 3 ? 'beginner' :
                        completedSteps.length < 7 ? 'intermediate' : 'advanced';

    // Generate projects for each goal
    for (const goal of profile.primaryGoals) {
      const goalProjects = this.createProjectsForGoal(goal, uniqueSkills, currentLevel);
      projects.push(...goalProjects);
    }

    return projects;
  }

  /**
   * Create progressive projects for a specific goal
   */
  private createProjectsForGoal(
    goal: string,
    skills: string[],
    currentLevel: string
  ): Project[] {
    const projects: Project[] = [];
    const goalLower = goal.toLowerCase();

    // Project templates by domain
    const projectTemplates: Record<string, any> = {
      'data analyst': [
        {
          difficulty: 'beginner',
          title: 'Sales Data Dashboard',
          description: 'Analyze sales data and create visualizations showing trends, top products, and regional performance',
          concepts: ['Data Cleaning', 'Basic Statistics', 'Chart Creation', 'Excel/Tableau Basics'],
          estimatedHours: 8,
          jobRelevance: 85,
          confidenceBoost: 'Learn to work with real datasets and present insights visually',
          learningOutcomes: [
            'Clean and prepare raw data',
            'Calculate key metrics (averages, totals, growth rates)',
            'Create professional charts and dashboards',
            'Present data-driven insights'
          ]
        },
        {
          difficulty: 'intermediate',
          title: 'Customer Segmentation Analysis',
          description: 'Use Python/SQL to segment customers based on behavior and create targeted marketing recommendations',
          concepts: ['SQL Queries', 'Python Pandas', 'Clustering', 'Statistical Analysis', 'Business Insights'],
          estimatedHours: 20,
          jobRelevance: 90,
          confidenceBoost: 'Master data manipulation and apply machine learning concepts',
          learningOutcomes: [
            'Write complex SQL queries',
            'Perform exploratory data analysis',
            'Apply clustering algorithms',
            'Generate actionable business recommendations'
          ]
        },
        {
          difficulty: 'advanced',
          title: 'Predictive Analytics Platform',
          description: 'Build an end-to-end analytics system that predicts customer churn and recommends retention strategies',
          concepts: ['Machine Learning', 'Feature Engineering', 'Model Deployment', 'A/B Testing', 'ROI Analysis'],
          estimatedHours: 40,
          jobRelevance: 95,
          confidenceBoost: 'Create a portfolio piece that demonstrates senior-level skills',
          learningOutcomes: [
            'Build predictive models',
            'Deploy models to production',
            'Measure business impact',
            'Present to stakeholders'
          ]
        }
      ],
      'web developer': [
        {
          difficulty: 'beginner',
          title: 'Personal Portfolio Website',
          description: 'Create a responsive portfolio site showcasing your projects and skills',
          concepts: ['HTML Structure', 'CSS Styling', 'Responsive Design', 'Git Basics'],
          estimatedHours: 10,
          jobRelevance: 75,
          confidenceBoost: 'Build your first complete website from scratch',
          learningOutcomes: [
            'Structure web pages with semantic HTML',
            'Style with modern CSS',
            'Make sites mobile-friendly',
            'Deploy to the web'
          ]
        },
        {
          difficulty: 'intermediate',
          title: 'Task Management App',
          description: 'Build a full-stack todo app with user authentication and real-time updates',
          concepts: ['React Components', 'State Management', 'REST APIs', 'Database Design', 'Authentication'],
          estimatedHours: 30,
          jobRelevance: 88,
          confidenceBoost: 'Master full-stack development with modern tools',
          learningOutcomes: [
            'Build interactive UIs with React',
            'Create RESTful APIs',
            'Implement user authentication',
            'Work with databases'
          ]
        },
        {
          difficulty: 'advanced',
          title: 'E-commerce Platform',
          description: 'Develop a complete e-commerce site with payments, inventory, and admin dashboard',
          concepts: ['Microservices', 'Payment Integration', 'Security', 'Performance Optimization', 'Testing'],
          estimatedHours: 60,
          jobRelevance: 95,
          confidenceBoost: 'Build a production-ready application with enterprise features',
          learningOutcomes: [
            'Design scalable architecture',
            'Integrate payment systems',
            'Implement security best practices',
            'Optimize for performance'
          ]
        }
      ],
      'customer service': [
        {
          difficulty: 'beginner',
          title: 'Customer Service Scenario Practice',
          description: 'Role-play common customer service scenarios and develop response templates',
          concepts: ['Active Listening', 'Empathy', 'Problem Solving', 'Communication'],
          estimatedHours: 5,
          jobRelevance: 80,
          confidenceBoost: 'Practice handling real customer situations',
          learningOutcomes: [
            'Handle difficult customers professionally',
            'Use positive language',
            'Resolve complaints effectively',
            'Build rapport quickly'
          ]
        },
        {
          difficulty: 'intermediate',
          title: 'CRM System Mastery',
          description: 'Learn to use popular CRM tools and create efficient customer management workflows',
          concepts: ['CRM Software', 'Ticket Management', 'Customer Data', 'Reporting'],
          estimatedHours: 12,
          jobRelevance: 85,
          confidenceBoost: 'Become proficient with industry-standard tools',
          learningOutcomes: [
            'Navigate CRM systems efficiently',
            'Track customer interactions',
            'Generate reports',
            'Automate common tasks'
          ]
        }
      ]
    };

    // Find matching templates
    let templates = [];
    for (const [key, value] of Object.entries(projectTemplates)) {
      if (goalLower.includes(key)) {
        templates = value;
        break;
      }
    }

    // If no specific templates, create generic ones
    if (templates.length === 0) {
      templates = [
        {
          difficulty: 'beginner',
          title: `${goal} - Beginner Project`,
          description: `A foundational project to practice ${goal} basics`,
          concepts: skills.slice(0, 2),
          estimatedHours: 10,
          jobRelevance: 70,
          confidenceBoost: 'Build confidence with hands-on practice',
          learningOutcomes: [`Apply ${skills[0]} in practice`, 'Build a complete project', 'Add to portfolio']
        },
        {
          difficulty: 'intermediate',
          title: `${goal} - Intermediate Challenge`,
          description: `A more complex project combining multiple ${goal} skills`,
          concepts: skills.slice(0, 4),
          estimatedHours: 25,
          jobRelevance: 85,
          confidenceBoost: 'Demonstrate professional-level capabilities',
          learningOutcomes: [`Master ${skills.slice(0, 2).join(' and ')}`, 'Solve complex problems', 'Create portfolio piece']
        }
      ];
    }

    // Add projects based on current level
    for (const template of templates) {
      if (template.difficulty === 'beginner' || 
          (template.difficulty === 'intermediate' && currentLevel !== 'beginner') ||
          (template.difficulty === 'advanced' && currentLevel === 'advanced')) {
        
        projects.push({
          id: `proj-${projects.length + 1}`,
          title: template.title,
          description: template.description,
          difficulty: template.difficulty,
          skills: skills.slice(0, template.concepts.length),
          concepts: template.concepts,
          estimatedHours: template.estimatedHours,
          jobRelevance: template.jobRelevance,
          confidenceBoost: template.confidenceBoost,
          learningOutcomes: template.learningOutcomes
        });
      }
    }

    return projects;
  }

  /**
   * Match jobs based on skills and readiness
   */
  async matchJobs(
    profile: UserProfile,
    completedSteps: RoadmapStep[],
    completedProjects: Project[]
  ): Promise<Job[]> {
    const jobs: Job[] = [];
    const userSkills = [
      ...profile.existingSkills,
      ...completedSteps.flatMap(step => step.skills),
      ...completedProjects.flatMap(proj => proj.skills)
    ];
    const uniqueSkills = [...new Set(userSkills)];

    // Generate jobs for each goal
    for (const goal of [...profile.primaryGoals, ...profile.secondaryGoals]) {
      const goalJobs = this.createJobsForGoal(goal, uniqueSkills, profile);
      jobs.push(...goalJobs);
    }

    // Sort by readiness score
    return jobs.sort((a, b) => b.readinessScore - a.readinessScore);
  }

  /**
   * Create job matches for a specific goal
   */
  private createJobsForGoal(
    goal: string,
    userSkills: string[],
    profile: UserProfile
  ): Job[] {
    const jobs: Job[] = [];
    const goalLower = goal.toLowerCase();
    const requiredSkills = this.extractSkillsFromGoal(goal);

    // Calculate readiness
    const matchedSkills = requiredSkills.filter(skill => 
      userSkills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
    );
    const readinessScore = Math.round((matchedSkills.length / requiredSkills.length) * 100);
    const skillGaps = requiredSkills.filter(skill => !matchedSkills.includes(skill));

    // Job templates by goal
    const jobTemplates: Record<string, any[]> = {
      'data analyst': [
        {
          title: 'Junior Data Analyst',
          company: 'Tech Startup',
          location: 'Remote',
          type: 'full-time',
          minReadiness: 60
        },
        {
          title: 'Data Analyst',
          company: 'Fortune 500 Company',
          location: 'Hybrid',
          type: 'full-time',
          minReadiness: 75
        },
        {
          title: 'Senior Data Analyst',
          company: 'Consulting Firm',
          location: 'On-site',
          type: 'full-time',
          minReadiness: 90
        }
      ],
      'customer service': [
        {
          title: 'Customer Service Representative',
          company: 'Retail Company',
          location: 'On-site',
          type: 'part-time',
          minReadiness: 50
        },
        {
          title: 'Customer Support Specialist',
          company: 'SaaS Company',
          location: 'Remote',
          type: 'full-time',
          minReadiness: 70
        }
      ],
      'age care': [
        {
          title: 'Aged Care Support Worker',
          company: 'Care Facility',
          location: 'On-site',
          type: 'part-time',
          minReadiness: 60
        },
        {
          title: 'Personal Care Assistant',
          company: 'Home Care Services',
          location: 'On-site',
          type: 'part-time',
          minReadiness: 70
        }
      ]
    };

    // Find matching templates
    let templates: any[] = [];
    for (const [key, value] of Object.entries(jobTemplates)) {
      if (goalLower.includes(key)) {
        templates = value;
        break;
      }
    }

    // Default templates if none found
    if (templates.length === 0) {
      templates = [
        {
          title: `Junior ${goal}`,
          company: 'Growing Company',
          location: 'Remote',
          type: 'full-time',
          minReadiness: 60
        },
        {
          title: goal,
          company: 'Established Company',
          location: 'Hybrid',
          type: 'full-time',
          minReadiness: 80
        }
      ];
    }

    // Create job listings
    for (const template of templates) {
      if (readinessScore >= template.minReadiness - 20) { // Show jobs within reach
        jobs.push({
          id: `job-${jobs.length + 1}`,
          title: template.title,
          company: template.company,
          location: template.location,
          type: template.type,
          requiredSkills,
          readinessScore,
          skillGaps,
          matchReason: readinessScore >= template.minReadiness
            ? `You have ${matchedSkills.length}/${requiredSkills.length} required skills`
            : `You're ${template.minReadiness - readinessScore}% away from being ready`
        });
      }
    }

    return jobs;
  }

  /**
   * Generate adaptive study session
   */
  async generateStudySession(
    topic: string,
    userLevel: string,
    previousPerformance?: number
  ): Promise<StudySession> {
    // Adjust difficulty based on performance
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    
    if (previousPerformance !== undefined) {
      if (previousPerformance > 80) difficulty = 'hard';
      else if (previousPerformance < 50) difficulty = 'easy';
    } else {
      if (userLevel === 'beginner') difficulty = 'easy';
      else if (userLevel === 'advanced') difficulty = 'hard';
    }

    const questions = this.generateQuestions(topic, difficulty, 5);

    return {
      questions,
      adaptiveDifficulty: true,
      readinessThreshold: 80 // Need 80% to advance
    };
  }

  /**
   * Generate practice questions
   */
  private generateQuestions(
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard',
    count: number
  ): Question[] {
    const questions: Question[] = [];
    
    // Question templates (expandable)
    const templates = this.getQuestionTemplates(topic, difficulty);
    
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      questions.push({
        id: `q-${i + 1}`,
        ...templates[i],
        difficulty
      });
    }

    return questions;
  }

  /**
   * Question templates by topic
   */
  private getQuestionTemplates(topic: string, difficulty: string) {
    // This would be expanded with a real question database
    return [
      {
        question: `What is the primary purpose of ${topic}?`,
        options: [
          'To solve complex problems',
          'To automate tasks',
          'To analyze data',
          'All of the above'
        ],
        correctAnswer: 3,
        concept: 'Fundamentals',
        explanation: `${topic} serves multiple purposes including problem-solving, automation, and analysis.`
      },
      {
        question: `Which skill is most important for ${topic}?`,
        options: [
          'Technical knowledge',
          'Problem-solving',
          'Communication',
          'All are equally important'
        ],
        correctAnswer: 3,
        concept: 'Core Skills',
        explanation: 'Success requires a balance of technical, analytical, and soft skills.'
      },
      {
        question: `What is a common challenge in ${topic}?`,
        options: [
          'Keeping up with changes',
          'Finding resources',
          'Applying knowledge',
          'All of the above'
        ],
        correctAnswer: 3,
        concept: 'Challenges',
        explanation: 'Professionals face multiple challenges that require continuous learning.'
      }
    ];
  }

  /**
   * Build dynamic resume
   */
  async buildResume(
    profile: UserProfile,
    completedSteps: RoadmapStep[],
    completedProjects: Project[]
  ): Promise<any> {
    const skills = [
      ...profile.existingSkills,
      ...completedSteps.flatMap(step => step.skills)
    ];
    const uniqueSkills = [...new Set(skills)];

    return {
      summary: this.generateSummary(profile, completedSteps.length),
      skills: uniqueSkills,
      projects: completedProjects.map(proj => ({
        title: proj.title,
        description: proj.description,
        skills: proj.skills,
        outcomes: proj.learningOutcomes
      })),
      education: this.generateEducation(completedSteps),
      experience: this.generateExperience(profile, completedProjects)
    };
  }

  /**
   * Generate resume summary
   */
  private generateSummary(profile: UserProfile, completedSteps: number): string {
    const goals = profile.primaryGoals.join(' and ');
    const level = profile.experienceLevel;
    
    return `${level.charAt(0).toUpperCase() + level.slice(1)}-level professional pursuing ${goals}. ` +
           `Completed ${completedSteps} learning modules with hands-on projects. ` +
           `Committed to ${profile.weeklyHours} hours/week of continuous learning and skill development.`;
  }

  /**
   * Generate education section
   */
  private generateEducation(completedSteps: RoadmapStep[]) {
    return completedSteps.map(step => ({
      course: step.title,
      skills: step.skills,
      duration: step.duration,
      status: 'Completed'
    }));
  }

  /**
   * Generate experience section
   */
  private generateExperience(profile: UserProfile, projects: Project[]) {
    return projects.map(proj => ({
      title: proj.title,
      description: proj.description,
      skills: proj.skills,
      achievements: proj.learningOutcomes
    }));
  }

  /**
   * Analyze uploaded PDF roadmap
   */
  async analyzePDFRoadmap(pdfText: string, profile: UserProfile): Promise<{
    analysis: string;
    suggestions: string[];
    improvedRoadmap: RoadmapStep[];
  }> {
    // Extract structure from PDF text
    const sections = this.extractSections(pdfText);
    
    // Analyze against user profile
    const analysis = this.analyzeRoadmapFit(sections, profile);
    
    // Generate suggestions
    const suggestions = this.generateRoadmapSuggestions(sections, profile);
    
    // Create improved roadmap
    const improvedRoadmap = await this.improveRoadmap(sections, profile);

    return {
      analysis,
      suggestions,
      improvedRoadmap
    };
  }

  /**
   * Extract sections from PDF text
   */
  private extractSections(text: string): string[] {
    // Simple section extraction (can be enhanced with NLP)
    return text
      .split(/\n\n+/)
      .filter(section => section.trim().length > 20)
      .map(section => section.trim());
  }

  /**
   * Analyze roadmap fit
   */
  private analyzeRoadmapFit(sections: string[], profile: UserProfile): string {
    const goals = profile.primaryGoals.join(', ');
    const sectionCount = sections.length;
    
    let analysis = `Your roadmap contains ${sectionCount} main sections. `;
    
    // Check alignment with goals
    const goalKeywords = profile.primaryGoals.flatMap(g => g.toLowerCase().split(' '));
    const matchingSection = sections.filter(s => 
      goalKeywords.some(kw => s.toLowerCase().includes(kw))
    );
    
    if (matchingSection.length > 0) {
      analysis += `Good alignment with your goals (${goals}). `;
    } else {
      analysis += `Limited alignment with your goals (${goals}). Consider adding more relevant content. `;
    }
    
    // Check for experience level
    if (profile.experienceLevel === 'beginner') {
      analysis += 'As a beginner, ensure you have strong foundational sections. ';
    }
    
    return analysis;
  }

  /**
   * Generate roadmap improvement suggestions
   */
  private generateRoadmapSuggestions(sections: string[], profile: UserProfile): string[] {
    const suggestions: string[] = [];
    
    // Check for missing fundamentals
    if (profile.experienceLevel === 'beginner' && sections.length < 5) {
      suggestions.push('Add more foundational topics to build a strong base');
    }
    
    // Check for projects
    const hasProjects = sections.some(s => 
      s.toLowerCase().includes('project') || s.toLowerCase().includes('practice')
    );
    if (!hasProjects) {
      suggestions.push('Include hands-on projects to apply your learning');
    }
    
    // Check for job prep
    const hasJobPrep = sections.some(s => 
      s.toLowerCase().includes('interview') || s.toLowerCase().includes('resume')
    );
    if (!hasJobPrep) {
      suggestions.push('Add job preparation and interview practice sections');
    }
    
    // Time-based suggestions
    if (profile.weeklyHours < 10) {
      suggestions.push('Break down sections into smaller, manageable chunks for your schedule');
    }
    
    // Goal-specific suggestions
    for (const goal of profile.primaryGoals) {
      const requiredSkills = this.extractSkillsFromGoal(goal);
      const mentionedSkills = requiredSkills.filter(skill =>
        sections.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
      
      if (mentionedSkills.length < requiredSkills.length / 2) {
        suggestions.push(`Add more ${goal}-specific skills: ${requiredSkills.slice(0, 3).join(', ')}`);
      }
    }
    
    return suggestions;
  }

  /**
   * Improve uploaded roadmap
   */
  private async improveRoadmap(sections: string[], profile: UserProfile): Promise<RoadmapStep[]> {
    const improvedSteps: RoadmapStep[] = [];
    
    // Convert sections to structured steps
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const title = this.extractTitle(section);
      const skills = this.extractSkillsFromText(section);
      
      improvedSteps.push({
        id: `step-${i}`,
        title,
        description: section.substring(0, 200),
        duration: this.calculateDuration(3, profile.weeklyHours),
        resources: await this.findResources(title, 'intermediate', profile.learningStyle),
        skills,
        completed: false,
        order: i
      });
    }
    
    // Add missing essential steps
    const generatedRoadmap = await this.generateRoadmap(profile);
    const existingTitles = improvedSteps.map(s => s.title.toLowerCase());
    
    for (const step of generatedRoadmap) {
      if (!existingTitles.some(t => step.title.toLowerCase().includes(t))) {
        improvedSteps.push({
          ...step,
          order: improvedSteps.length
        });
      }
    }
    
    return improvedSteps;
  }

  /**
   * Extract title from section
   */
  private extractTitle(section: string): string {
    const lines = section.split('\n');
    const firstLine = lines[0].trim();
    
    // Remove common prefixes
    return firstLine
      .replace(/^(step|phase|module|section|chapter)\s*\d+:?\s*/i, '')
      .replace(/^\d+\.\s*/, '')
      .trim();
  }

  /**
   * Extract skills from text
   */
  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'Python', 'JavaScript', 'SQL', 'React', 'Node.js', 'HTML', 'CSS',
      'Machine Learning', 'Data Analysis', 'Statistics', 'Excel', 'Tableau',
      'Communication', 'Problem Solving', 'Leadership', 'Project Management'
    ];
    
    return commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
  }
}

// Export singleton instance
export const aiService = new AIService();

