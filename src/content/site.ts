/**
 * Site-wide facts. Update links here — every page reads from this file.
 */
export const site = {
  name: "Patrick Loic",
  fullName: "Kangue Kwelle Patrick Loic",
  initials: "PL",
  email: "kangue.patrick21@gmail.com",
  url: "https://kangueloic.vercel.app",
  studio: {
    name: "KreativEinfluss",
    url: "https://kreativeinfluss-digital-canvas.kangue-patrick21.workers.dev",
  },
  social: {
    github: { url: "https://github.com/PatrickLoic-dev", handle: "github.com/PatrickLoic-dev" },
    linkedin: { url: "https://www.linkedin.com/in/patrick-loic-kangue-kwelle/", handle: "linkedin.com/in/patrick-loic-kangue-kwelle" },
    x: { url: "https://x.com/KewellLoic", handle: "@KewellLoic" },
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

export const stats = [
  { value: "4+", key: "years" },
  { value: "9", key: "projects" },
  { value: "2", key: "languages" },
  { value: "1", key: "studio" },
] as const;
