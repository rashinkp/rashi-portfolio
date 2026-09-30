export const skillGroups = [
  {
    title: 'Frontend',
    skills: [
      'React',
      'Next.js',
      'TypeScript',
      'React Router',
      'TanStack Query',
      'React Hook Form',
      'Tailwind CSS',
      'Responsive UI',
    ],
  },
  {
    title: 'Backend',
    skills: [
      'Node.js',
      'Express',
      'NestJS',
      'REST APIs',
      'Zod',
    ],
  },
  {
    title: 'Databases',
    skills: [
      'MongoDB',
      'MySQL',
      'PostgreSQL',
      'SQL',
      'Kysely',
      'Indexing',
      'Aggregation',
    ],
  },
  {
    title: 'AI & Python',
    skills: [
      'Python',
      'FastAPI',
      'Gemini API',
      'Embeddings',
      'Resume Parsing',
      'Candidate Scoring',
      'Semantic Similarity',
    ],
  },
  {
    title: 'Authentication & security',
    skills: [
      'JWT',
      'Refresh Tokens',
      'OAuth 2.0 + PKCE',
      'RBAC',
      'HttpOnly Cookies',
      'Multi-tenant Isolation',
    ],
  },
  {
    title: 'Integrations',
    skills: [
      'Google Calendar',
      'Microsoft Teams Calendar',
      'Socket.IO',
      'WhatsApp Cloud API',
      'OCI Object Storage',
      'OneSignal',
      'Stripe',
      'Razorpay',
    ],
  },
  {
    title: 'Cloud & deployment',
    skills: [
      'AWS EC2',
      'Amazon S3',
      'Railway',
      'Vercel',
      'Render',
      'Docker',
    ],
  },
  {
    title: 'Engineering',
    skills: [
      'Clean Architecture',
      'Modular Monolith',
      'Vitest',
      'Pytest',
      'Playwright',
      'Sentry',
      'Git',
    ],
  },
]

export const offrollsHighlights = [
  {
    title: 'Full-stack product workflows',
    description: 'Multi-role React interfaces and modular TypeScript REST APIs.',
  },
  {
    title: 'AI-assisted hiring',
    description: 'Resume parsing, candidate scoring, and screening workflows.',
  },
  {
    title: 'Calendar automation',
    description: 'Google Calendar and Microsoft Teams calendar integration with OAuth 2.0 and PKCE.',
  },
  {
    title: 'Security and real-time systems',
    description: 'Authentication, RBAC, live updates, and market-aware data isolation.',
  },
]

export const offrollsStack = [
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'MySQL',
  'Python',
  'FastAPI',
  'Gemini',
  'Socket.IO',
  'OAuth 2.0',
]

export const featuredProjects = [
  {
    name: 'ByWay',
    type: 'Learning platform',
    description:
      'Built a learning platform that connects course purchases, interactive lessons, tutor applications, and certificates in one student journey.',
    highlights: [
      {
        title: 'Tutor onboarding',
        description: 'Role-based onboarding lets students apply to become tutors',
      },
      {
        title: 'Social sign-in',
        description: 'Google and Facebook OAuth support account sign-in',
      },
      {
        title: 'Course payments',
        description: 'Stripe webhooks connect payments to the purchase workflow',
      },
      {
        title: 'Real-time communication',
        description: 'Socket.IO delivers chat messages and notifications in real time',
      },
    ],
    stack: ['Next.js', 'TypeScript', 'Stripe', 'Socket.IO', 'Docker'],
    image: '/projects/byway-preview.png',
    imageAlt: 'ByWay learning platform landing page',
    live: 'https://byway-3yj3.onrender.com/',
    github: 'https://github.com/rashinkp/byway',
  },
  {
    name: 'Mobilify',
    type: 'E-commerce platform',
    description:
      'Built an electronics storefront connecting checkout, wallet payments, refunds, inventory, and order management across the purchase lifecycle.',
    highlights: [
      {
        title: 'Storefront state',
        description: 'Redux Toolkit and RTK Query manage storefront state and API data',
      },
      {
        title: 'Inventory and orders',
        description: 'Express APIs and MongoDB support inventory and order workflows',
      },
      {
        title: 'Payments and refunds',
        description: 'Razorpay handles payments and refunds alongside wallet support',
      },
      {
        title: 'Deployment and live updates',
        description: 'Live stock and order updates run on an AWS deployment',
      },
    ],
    stack: ['React', 'Node.js', 'MongoDB', 'Razorpay', 'AWS'],
    image: '/projects/mobilify-preview.png',
    imageAlt: 'Mobilify electronics storefront landing page',
    live: 'https://mobilify-two.vercel.app/',
    github: 'https://github.com/rashinkp/mobilify',
  },
]

export const additionalProjects = [
  {
    name: 'LinkUp — Real-Time Chat',
    description:
      'One-to-one messaging with live delivery, presence updates, dynamic theming, and an event-driven React, Express, MongoDB, and Socket.IO architecture.',
    github: 'https://github.com/rashinkp/linkup',
  },
  {
    name: 'Wholesale Delivery Management',
    description:
      'A NestJS logistics system for wholesalers, vendors, inventory, and delivery orders with JWT authentication and role-based access.',
    github: 'https://github.com/rashinkp/Delivery-Management',
  },
  {
    name: 'Aadhaar OCR Extraction',
    description:
      'A document-processing service using Node.js, Express, Tesseract OCR, and MongoDB to validate Aadhaar images and extract user details.',
    github: 'https://github.com/rashinkp/adhaar-ocr',
  },
  {
    name: 'Student Management System',
    description:
      'A record and attendance platform with Google OAuth, admin CRUD workflows, Express, HBS, MongoDB, and an MVC structure.',
    github: 'https://github.com/rashinkp/Student-Management-System',
  },
]

