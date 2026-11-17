/**
 * Single source of truth for the initial portfolio content.
 *
 *  - `npm run seed:sql` turns this file into supabase/seed.sql (run once in Supabase).
 *  - When Supabase is not configured, the public site renders this data directly
 *    (read-only preview mode), so the site always has something real to show.
 *
 * Everything here comes from information Jeet supplied or from his public pages.
 * Unknown details are left empty on purpose — fill them in from the admin panel.
 */
import type {
  Achievement,
  Category,
  Education,
  Experience,
  Profile,
  Project,
  SiteContent,
  SiteSettings,
  SocialLink,
  Technology,
} from '../types'

const uid = (group: number, n: number) =>
  `${group.toString(16).padStart(8, '0')}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+/g, 'p')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
const NOW = '2026-11-10T00:00:00.000Z'

/* ------------------------------------------------------------------ profile */

export const profile: Profile = {
  id: uid(1, 1),
  full_name: 'Jeet Patel',
  headline: 'Developer, product builder and founder of RAGBOOMS',
  intro:
    "I'm a developer and product builder based in Ahmedabad, India. I like taking an idea from a rough concept to working software that people can actually use.",
  bio: "I'm a B.Tech Information Technology student at JG University and the person behind RAGBOOMS. My work sits where software engineering meets real business problems: retail tools, mobile apps, AI-assisted systems and the dashboards that keep e-commerce operations running.\n\nAlongside my studies I manage e-commerce and technology at Divine Tree, which keeps me close to how software behaves once it meets catalogues, marketplaces, fulfilment and customers.",
  journey:
    'I started with the web — HTML, CSS and JavaScript — and kept following the problems. That led to React and Node on the web, Flutter on mobile, and Python for computer vision and machine learning. Hackathons, college projects and client-style work taught me to ship under constraints; running real e-commerce operations taught me what software has to survive after launch.',
  what_i_build:
    'Web applications, mobile apps, AI integrations and internal tools. Some are products I am building for the long run, some are client-oriented software, and some are experiments I use to learn a technology properly.',
  philosophy:
    'Start from the problem, not the stack. Ship something small that works, put it in front of real users, and let what they do decide what gets built next. Understand the business well enough that the software fits how people already work.',
  interests: [
    'Product engineering',
    'Full-stack development',
    'AI agents and automation',
    'SaaS',
    'E-commerce technology',
    'Mobile applications',
    'Computer vision',
    'Business operations',
  ],
  location: 'Ahmedabad, India',
  avatar_url: null,
  email: '',
  resume_url: null,
  hero_eyebrow: 'Independent technology studio',
  hero_headline: 'Turning ideas into intelligent digital experiences.',
  hero_subtext:
    "I'm Jeet Patel — a developer and product builder exploring software engineering, AI, automation, and digital products. I build solutions that connect technology with real-world problems.",
  taglines: [
    'Building technology that turns ideas into reality.',
    'Ideas. Engineering. Impact.',
    'From concepts to products.',
  ],
}

/* ----------------------------------------------------------------- settings */

export const settings: SiteSettings = {
  general: {
    title: 'RAGBOOMS',
    description:
      'RAGBOOMS is the technology studio of Jeet Patel — software engineering, AI, automation and digital products.',
    logo_url: '/brand/logo.png',
    favicon_url: '/brand/favicon.svg',
    og_image_url: '',
    contact_email: '',
  },
  colors: { brand: '#087F5B', accent: '#0EAD78', highlight: '#18C995' },
  navigation: [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Projects', path: '/projects' },
    { label: 'Experience', path: '/experience' },
    { label: 'Labs', path: '/labs' },
    { label: 'Achievements', path: '/achievements' },
    { label: 'Contact', path: '/contact' },
  ],
  footer: {
    statement: 'Building technology that turns ideas into reality.',
    cta_label: "Let's Work Together",
  },
  announcement: { enabled: false, text: '', link: '' },
  maintenance: { enabled: false, message: 'RAGBOOMS is being updated. Please check back shortly.' },
}

/* --------------------------------------------------------------- categories */

export const categories: Category[] = [
  'Web Development',
  'Mobile Applications',
  'AI & Machine Learning',
  'SaaS Products',
  'Developer Tools',
  'Business Solutions',
  'IoT & Hardware',
  'Research & Experiments',
].map((name, i) => ({ id: uid(2, i + 1), name, slug: slugify(name), sort_order: i }))

/* ------------------------------------------------------------- technologies */

type P = Technology['proficiency']
const W: P = 'Working Knowledge'
const F: P = 'Familiar'
const skillGroups: [string, [string, P][]][] = [
  [
    'Languages',
    [
      ['JavaScript', W],
      ['TypeScript', W],
      ['Python', W],
      ['Dart', W],
      ['HTML', W],
      ['CSS', W],
      ['SQL', F],
    ],
  ],
  [
    'Frontend',
    [
      ['React', W],
      ['Vite', W],
      ['Tailwind CSS', W],
      ['Framer Motion', F],
      ['Responsive UI', W],
    ],
  ],
  [
    'Backend',
    [
      ['Node.js', W],
      ['Express.js', W],
      ['Django', F],
      ['REST APIs', W],
      ['PostgreSQL', F],
      ['SQLite', F],
      ['MongoDB', F],
      ['Auth & authorization', F],
    ],
  ],
  [
    'Mobile',
    [
      ['Flutter', W],
      ['Android', F],
    ],
  ],
  [
    'AI & Computer Vision',
    [
      ['YOLO', F],
      ['OpenCV', F],
      ['Object detection', F],
      ['Machine learning', F],
      ['AI agents', F],
      ['RAG', F],
      ['LLM integrations', F],
      ['Gemini API', F],
      ['LangChain', F],
      ['Google ADK', F],
    ],
  ],
  [
    'Tools & Deployment',
    [
      ['Git', W],
      ['GitHub', W],
      ['Postman', W],
      ['Docker', F],
      ['CI/CD', F],
      ['Vercel', W],
      ['Netlify', F],
      ['Android Studio', F],
      ['Google Play Console', F],
    ],
  ],
  [
    'AI-assisted Development',
    [
      ['Claude', F],
      ['ChatGPT', F],
      ['Codex', F],
      ['Gemini', F],
      ['Lovable', F],
      ['Antigravity', F],
      ['Kiro', F],
    ],
  ],
]

/** Technologies that appear on projects but are not listed as skills. */
const projectOnlyTech = ['TanStack Start', 'Coral', 'Raspberry Pi']

export const technologies: Technology[] = (() => {
  const out: Technology[] = []
  let n = 0
  for (const [group, items] of skillGroups)
    for (const [name, proficiency] of items) {
      n++
      out.push({ id: uid(3, n), name, slug: slugify(name), group_name: group, proficiency, visible: true, sort_order: n })
    }
  for (const name of projectOnlyTech) {
    n++
    out.push({ id: uid(3, n), name, slug: slugify(name), group_name: null, proficiency: null, visible: false, sort_order: n })
  }
  return out
})()

/* ----------------------------------------------------------------- projects */

type Seed = Partial<Project> & Pick<Project, 'title' | 'short_description' | 'status' | 'categories'>
let pn = 0
const project = (p: Seed): Project => {
  pn++
  return {
    id: uid(4, pn),
    slug: slugify(p.title),
    description: '',
    problem: '',
    solution: '',
    features: [],
    planned_features: [],
    challenges: '',
    architecture: '',
    visibility: 'published',
    featured: false,
    is_lab: false,
    sort_order: pn,
    cover_url: null,
    gallery: [],
    video_url: null,
    github_url: null,
    live_url: null,
    docs_url: null,
    download_url: null,
    start_date: null,
    end_date: null,
    seo_title: null,
    seo_description: null,
    github_repo_id: null,
    github_meta: null,
    changelog: [],
    technologies: [],
    created_at: NOW,
    updated_at: NOW,
    ...p,
  }
}
const lab = (
  title: string,
  short_description: string,
  status: Project['status'],
  cats: string[],
  tech: string[] = [],
  extra: Partial<Project> = {},
) => project({ title, short_description, status, categories: cats, technologies: tech, is_lab: true, ...extra })

export const projects: Project[] = [
  project({
    title: 'Vyavastha',
    short_description:
      'Billing and inventory for Indian retail and kirana stores — one of my main product initiatives, currently in public beta.',
    status: 'Live',
    featured: true,
    categories: ['saas-products', 'mobile-applications', 'business-solutions'],
    technologies: ['Vercel'],
    live_url: 'https://vyavastha-v1.vercel.app/',
    description:
      'Vyavastha is a store-management product for retail and kirana businesses. It brings inventory, billing, payments and invoices into a single app, designed to be fast and to keep working without an internet connection.\n\nIt is available as an Android beta, with the product site and download hosted on Vercel.',
    problem:
      'Many small Indian stores still run on pen, paper and memory. Stock runs out without warning, billing is slow at busy hours, and existing software is often built for larger businesses rather than a single shop counter.',
    solution:
      'A focused, offline-first app that covers the daily loop of a store: add products, bill customers in seconds, accept UPI payments, share an invoice and see how the day went.',
    features: [
      'Inventory and product management with low-stock alerts',
      'Fast billing with product search',
      'UPI QR payments',
      'PDF invoices with GST fields',
      'Business dashboard with sales reports',
      'Offline-first local storage',
    ],
    planned_features: [
      'Thermal printer support',
      'GST e-invoicing and multi-tax',
      'Windows app with cloud sync',
      'Multi-store management',
    ],
  }),
  project({
    title: 'AutoLog',
    short_description:
      'A personal vehicle companion built with Flutter — fuel logs, service history and expenses for every vehicle you own.',
    status: 'In Development',
    featured: true,
    categories: ['mobile-applications'],
    technologies: ['Flutter', 'Dart', 'Android'],
    github_url: 'https://github.com/JeetP1711/AutoLog',
    description:
      'AutoLog is a vehicle management and tracking app for owners who want one place for everything about their vehicles. It is built with Flutter and packaged for Android as com.jeetpatel.autolog.',
    problem:
      'Fuel bills, service dates and maintenance history usually live in scattered receipts and memory, which makes it hard to know what a vehicle really costs or when it is next due for service.',
    solution:
      'A single app that keeps a running record per vehicle — every fill-up, every service, every expense — so the history is always at hand.',
    features: [
      'Multiple vehicle management',
      'Fuel tracking with support for different fuel types',
      'Fuel expense records',
      'Service and maintenance tracking',
      'Vehicle history',
    ],
  }),
  project({
    title: 'EventOps AI',
    short_description:
      'An AI-assisted operations dashboard for enterprise event management, with an in-app assistant.',
    status: 'In Development',
    featured: true,
    categories: ['ai-machine-learning', 'web-development', 'business-solutions'],
    technologies: ['React', 'TypeScript', 'Vite', 'TanStack Start', 'Gemini API', 'Coral', 'AI agents'],
    description:
      'EventOps AI (also called Enterprise Agent) is an operations and event-management dashboard that pairs a conventional interface with an AI assistant.',
    architecture:
      'React front end in the TanStack Start / Vite TypeScript ecosystem. The assistant talks to a Coral backend integration and a Gemini service layer.',
  }),
  project({
    title: 'CodeLens',
    short_description:
      'AI-powered developer insights: enter a GitHub username and get an analysis of the code behind the profile.',
    status: 'Live',
    featured: true,
    categories: ['developer-tools', 'ai-machine-learning', 'web-development'],
    technologies: ['TypeScript', 'Lovable', 'LLM integrations'],
    github_url: 'https://github.com/JeetP1711/dev-insights-ai',
    live_url: 'https://code-lens.lovable.app',
    description:
      'CodeLens (repository: dev-insights-ai) is a developer-portfolio intelligence tool. It analyses a GitHub account and its repositories and presents the result as a developer profile.',
    features: [
      'Analysis by GitHub username',
      'Repository-level code analysis',
      'Activity overview',
      'Side-by-side compare mode',
      'PDF reports',
    ],
  }),
  project({
    title: 'Nivaas',
    short_description: 'A property and housing technology platform initiative.',
    status: 'Concept',
    categories: ['saas-products', 'business-solutions'],
    description:
      'Nivaas is a product initiative focused on property and housing-related technology. Details will be added as the platform takes shape.',
  }),

  /* ---- Labs & Experiments ------------------------------------------------ */
  lab(
    'Smart Proctoring System',
    'An AI-based proctoring concept that uses computer vision and audio analysis to flag suspicious behaviour in online exams.',
    'Prototype',
    ['ai-machine-learning', 'research-experiments'],
    ['Python', 'OpenCV'],
    { github_url: 'https://github.com/JeetP1711/SMART-PROCTORING-SYSTEM' },
  ),
  lab(
    'Object Detection Model',
    'Experiments in training and running object detection models.',
    'Prototype',
    ['ai-machine-learning', 'research-experiments'],
    ['Python', 'YOLO', 'OpenCV', 'Object detection'],
    { github_url: 'https://github.com/JeetP1711/Object-Detection-Project' },
  ),
  lab(
    'E-memo Speed Detection System',
    'A computer-vision exploration of detecting vehicle speed for automated e-memos.',
    'Prototype',
    ['ai-machine-learning', 'research-experiments'],
    ['Python', 'OpenCV'],
  ),
  lab(
    'Intelligent Traffic Signal Optimization',
    'Research into adapting traffic signal timing to live traffic conditions.',
    'Research',
    ['ai-machine-learning', 'research-experiments'],
  ),
  lab(
    'Hospital Inventory Management System',
    'An inventory management system designed around hospital stock.',
    'Prototype',
    ['business-solutions', 'web-development'],
  ),
  lab('Het Consultancy Website', 'A website built for Het Consultancy.', 'Completed', ['web-development']),
  lab(
    'Solar Quotation Generator',
    'A tool that generates quotations for solar installations.',
    'Prototype',
    ['business-solutions', 'web-development'],
  ),
  lab('Habit Tracker Application', 'A small app for tracking daily habits.', 'Prototype', ['mobile-applications']),
  lab(
    'Society Management System',
    'A management system for residential societies.',
    'Prototype',
    ['business-solutions', 'web-development'],
  ),
  lab('Resume Builder Application', 'An application for building resumes.', 'Prototype', ['web-development']),
  lab('Sustainify Eco-Quest', 'A sustainability-themed project.', 'Prototype', ['research-experiments']),
  lab(
    'Multi-Modal Evidence Review Application',
    'An application for reviewing evidence across multiple media types.',
    'Prototype',
    ['ai-machine-learning', 'research-experiments'],
  ),
  lab(
    'Raspberry Pi & IoT Experiments',
    'Hardware experiments with Raspberry Pi and connected devices.',
    'Research',
    ['iot-hardware', 'research-experiments'],
    ['Python', 'Raspberry Pi'],
    { github_url: 'https://github.com/JeetP1711/hardware-iot-projects' },
  ),
  lab('Flutter Music Player', 'A music player built with Flutter.', 'Prototype', ['mobile-applications'], ['Flutter', 'Dart']),
  lab(
    'ShipOpt — Meesho Image Optimizer',
    'A concept for optimising marketplace product images with shipping in mind.',
    'Concept',
    ['business-solutions', 'research-experiments'],
  ),
  lab(
    'Divine Tree E-commerce Tools',
    'Internal tools and dashboards built for Divine Tree e-commerce operations.',
    'In Development',
    ['business-solutions', 'web-development'],
  ),
  lab(
    'Marketplace Analytics Concepts',
    'Concepts for product comparison and marketplace analytics.',
    'Concept',
    ['business-solutions', 'research-experiments'],
  ),
]

/* --------------------------------------------------------------- experience */

const exp = (n: number, e: Partial<Experience> & Pick<Experience, 'company' | 'role'>): Experience => ({
  id: uid(5, n),
  employment_type: '',
  date_label: '',
  start_date: null,
  end_date: null,
  is_current: false,
  location: '',
  description: '',
  responsibilities: [],
  achievements: [],
  technologies: [],
  logo_url: null,
  website_url: null,
  visible: true,
  sort_order: n,
  ...e,
})

export const experiences: Experience[] = [
  exp(1, {
    company: 'Divine Tree',
    role: 'E-commerce Manager — Technology & Operations',
    date_label: 'Present',
    is_current: true,
    website_url: 'https://www.divinetreeindia.com/',
    description:
      "I manage and develop Divine Tree's e-commerce operations and work on improving the company's digital infrastructure — a mix of business operations, product development and technology leadership.",
    responsibilities: [
      'E-commerce platform development and website modernisation',
      'Marketplace management across Amazon, Flipkart and Meesho',
      'Product listing management and catalogue optimisation',
      'E-commerce sales analysis and operational dashboards',
      'Fulfilment strategy and digital growth initiatives',
      'E-commerce application planning',
      'Business process automation',
      'Exploring tools for marketplace operations, analytics, product management and shipping optimisation',
    ],
  }),
  exp(2, {
    company: 'RAGBOOMS',
    role: 'Founder — Product Engineering',
    date_label: 'Ongoing',
    is_current: true,
    description:
      'My own technology brand and product development initiative. I lead technical development and product engineering across everything built under the RAGBOOMS name.',
    responsibilities: [
      'Product development',
      'Web applications',
      'Mobile applications',
      'AI integrations',
      'Custom software solutions',
      'Technical architecture',
      'Product experimentation',
    ],
  }),
  exp(3, {
    company: 'Het Consultancy',
    role: 'Intern',
    employment_type: 'Internship',
    date_label: '2024 – 2025',
  }),
  exp(4, {
    company: 'Kites',
    role: 'Intern',
    employment_type: 'Internship',
    date_label: '2024',
  }),
]

/* ------------------------------------------------------------- achievements */

const ach = (n: number, a: Partial<Achievement> & Pick<Achievement, 'title' | 'organization' | 'kind'>): Achievement => ({
  id: uid(6, n),
  date_label: '',
  achieved_on: null,
  description: '',
  certificate_url: null,
  verification_url: null,
  project_id: null,
  featured: false,
  visible: true,
  sort_order: n,
  ...a,
})

export const achievements: Achievement[] = [
  ach(1, {
    title: 'Top-10 prize, Google hackathon',
    organization: 'Google',
    kind: 'Hackathon',
    featured: true,
    description: 'Received a top-10 prize in a Google hackathon.',
  }),
  ach(2, {
    title: 'Two Google hackathons',
    organization: 'Google',
    kind: 'Hackathon',
    description: 'Participated in two Google hackathons.',
  }),
  ach(3, {
    title: 'Top 30, IIT Gandhinagar game jam',
    organization: 'IIT Gandhinagar',
    kind: 'Competition',
    featured: true,
    description: 'Took part in a game jam at IIT Gandhinagar and reached the top 30.',
  }),
  ach(4, {
    title: "Organiser, TechNexa '26",
    organization: 'JG University',
    kind: 'Leadership',
    featured: true,
    description: "Organised the TechNexa '26 hackathon at JG University.",
  }),
  ach(5, {
    title: 'Secretary, Entrepreneurship Cell',
    organization: 'Entrepreneurship Cell',
    kind: 'Leadership',
    featured: true,
    description: 'Served as Secretary of the Entrepreneurship Cell.',
  }),
]

/* ---------------------------------------------------------------- education */

export const education: Education[] = [
  {
    id: uid(7, 1),
    institution: 'JG University, Ahmedabad',
    degree: 'Bachelor of Technology (B.Tech)',
    field: 'Information Technology',
    date_label: 'Fourth year · expected completion March/April 2027',
    description: '',
    sort_order: 1,
  },
]

/* ------------------------------------------------------------------ socials */

export const socials: SocialLink[] = [
  {
    id: uid(8, 1),
    platform: 'github',
    label: 'GitHub',
    url: 'https://github.com/JeetP1711',
    visible: true,
    sort_order: 1,
  },
  // LinkedIn is intentionally left without a URL: add it in Admin → Profile and it will appear.
  { id: uid(8, 2), platform: 'linkedin', label: 'LinkedIn', url: '', visible: true, sort_order: 2 },
]

export const seedContent: SiteContent = {
  profile,
  settings,
  projects,
  categories,
  technologies,
  experiences,
  achievements,
  education,
  socials,
}
