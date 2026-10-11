export type DiscoveryFilter = "Today" | "Tomorrow" | "This month" | "Later";

export type FeaturedOpportunityTone = "violet" | "orange" | "lime";

export type FeaturedOpportunity = {
  id: string;
  scope: "Global" | "Local";
  time: string;
  title: string;
  host: string;
  reward: string;
  arenas: number;
  tone: FeaturedOpportunityTone;
};

export type Arena = {
  id: string;
  scope: "Global" | "Local";
  time: string;
  title: string;
  brief: string;
  rank: string;
  rankTone: "up" | "steady";
  reward: string;
  participants: string[];
};
