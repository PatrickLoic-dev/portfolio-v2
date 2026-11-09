/**
 * Site-wide facts. Update links here — every page reads from this file.
 */
export const site = {
  name: "Patrick Loic",
  fullName: "Kangue Kwelle Patrick Loic",
  initials: "PL",
  email: "kangue.patrick21@gmail.com",
  url: "https://patrickloic.dev",
  studio: {
    name: "KreativEinfluss",
    url: "https://kreativeinfluss-digital-canvas.kangue-patrick21.workers.dev",
  },
  // TODO: replace with your real profile URLs and handles.
  social: {
    github: { url: "https://github.com", handle: "github.com/patrickloic" },
    linkedin: { url: "https://linkedin.com", handle: "linkedin.com/in/patrickloic" },
    x: { url: "https://x.com", handle: "@patrickloic" },
  },
  cv: {
    en: "/cv/patrick-loic-cv-en.pdf",
    fr: "/cv/patrick-loic-cv-fr.pdf",
  },
} as const;

export const toolkit = [
  "JavaScript",
  "TypeScript",
  "Angular",
  "React Native",
  "Ionic",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Redux",
  "Sass",
  "Stencil",
  "NestJS",
  "Node.js",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "SQL",
  "Docker",
  "Git",
];

export const toolkitGroups = [
  { key: "frontend", items: ["JavaScript", "TypeScript", "Angular", "React", "Next.js", "Redux", "Stencil"] },
  { key: "mobile", items: ["React Native", "Ionic", "Tailwind CSS", "Sass"] },
  { key: "backend", items: ["NestJS", "Node.js", "PostgreSQL", "MongoDB", "MySQL", "SQL"] },
  { key: "workflow", items: ["Docker", "Git", "Notion"] },
] as const;

export type Experience = {
  title: { en: string; fr: string };
  company: string;
  type: "fulltime" | "internship";
  months: number;
  start: string; // YYYY-MM
  end: string; // YYYY-MM
};

export const experiences: Experience[] = [
  {
    title: { en: "Digital Consultant", fr: "Consultant digital" },
    company: "Londo Technology",
    type: "fulltime",
    months: 6,
    start: "2024-10",
    end: "2025-03",
  },
  {
    title: { en: "Frontend Development Intern", fr: "Stagiaire développeur frontend" },
    company: "One Touch Labs",
    type: "internship",
    months: 4,
    start: "2023-05",
    end: "2023-08",
  },
  {
    title: { en: "Digital Consultant", fr: "Consultant digital" },
    company: "Get Ready Digital Solutions",
    type: "fulltime",
    months: 18,
    start: "2021-06",
    end: "2022-11",
  },
];

export type Testimonial = {
  id: string;
  name: string;
  initials: string;
  /** Tailwind background for the initials badge. */
  tone: string;
  role: { en: string; fr: string };
  company: string;
  quote: { en: string; fr: string };
};

/** "Kind words" on Home and About, shown in this order. */
export const testimonials: Testimonial[] = [
  {
    id: "leandre",
    name: "Leandre Thydian Mandessi Kwelle",
    initials: "LK",
    tone: "bg-blob-b",
    role: { en: "Principal Architect & Co-founder", fr: "Architecte principal et co-fondateur" },
    company: "Asante Artsy",
    quote: {
      en: "Our work is about restraint, light and space, and Patrick understood that from the very first conversation. The site he built lets every project breathe: clients now discover our architecture the way we meant it to be seen.",
      fr: "Notre travail parle de retenue, de lumière et d'espace, et Patrick l'a compris dès la première conversation. Le site qu'il a construit laisse respirer chaque projet : nos clients découvrent enfin notre architecture telle que nous voulions qu'elle soit vue.",
    },
  },
  {
    id: "ignace",
    name: "Ignace Cabrel Elouga",
    initials: "IE",
    tone: "bg-blob-a",
    role: { en: "Managing Partner", fr: "Associé gérant" },
    company: "Think Tech Solutions",
    quote: {
      en: "Patrick pairs a sharp technical eye with a real sense of product. He asks the right questions early, ships clean and reliable interfaces, and keeps everyone aligned. He's exactly the partner you want on a project that matters.",
      fr: "Patrick allie un vrai regard technique et un sens aigu du produit. Il pose les bonnes questions tôt, livre des interfaces propres et fiables, et garde tout le monde aligné. C'est exactement le partenaire qu'on veut sur un projet qui compte.",
    },
  },
];

export const stats = [
  { value: "4+", key: "years" },
  { value: "9", key: "projects" },
  { value: "2", key: "languages" },
  { value: "1", key: "studio" },
] as const;
