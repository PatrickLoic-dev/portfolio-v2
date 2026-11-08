import type { MDXComponents } from "mdx/types";
import { CodeBlock, Tip } from "@/components/blog/mdx-parts";

const components: MDXComponents = {
  CodeBlock,
  Tip,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
