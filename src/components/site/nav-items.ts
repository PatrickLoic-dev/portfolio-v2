export const navItems = [
  { href: "/", key: "home" },
  { href: "/work", key: "work" },
  { href: "/about", key: "about" },
  { href: "/process", key: "process" },
  { href: "/passions", key: "passions" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
