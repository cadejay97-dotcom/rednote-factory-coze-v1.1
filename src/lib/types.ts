export interface Tool {
  id: number;
  name: string;
  github: string;
  coreFeature: string;
  techStack: string;
  star?: string;
  rating: number;
  category: string;
  scenario: string;
  highlight: string;
}

export interface Combo {
  id: number;
  name: string;
  description: string;
  steps: { title: string; tools: string[]; desc: string }[];
  level: '入门' | '进阶' | '高阶';
}

export interface ToolsResponse {
  tools: Tool[];
  combos: Combo[];
}
