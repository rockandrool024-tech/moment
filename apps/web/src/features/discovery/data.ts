import type { Arena, DiscoveryFilter, FeaturedOpportunity } from "./model";

export const discoveryFilters: DiscoveryFilter[] = ["Today", "Tomorrow", "This month", "Later"];

export const featuredOpportunities: FeaturedOpportunity[] = [
  {
    id: "gymshark-opening",
    scope: "Global",
    time: "2d",
    title: "Gymshark Opening Weekend",
    host: "DFYNE, Gymshark, Squat Wolf + 2 more",
    reward: "€1,200 creator pool",
    arenas: 3,
    tone: "violet",
  },
  {
    id: "endless-design",
    scope: "Local",
    time: "4d",
    title: "Endless Design League",
    host: "MENA design hosts",
    reward: "€650 creator pool",
    arenas: 2,
    tone: "orange",
  },
  {
    id: "street-food-stories",
    scope: "Local",
    time: "6d",
    title: "Street Food Stories",
    host: "Tunis, Casablanca + 4 cities",
    reward: "€400 creator pool",
    arenas: 4,
    tone: "lime",
  },
];

export const discoveryArenas: Arena[] = [
  {
    id: "pull-ups",
    scope: "Global",
    time: "4hrs",
    title: "Pull Ups",
    brief: "Show the strongest version of your everyday ritual.",
    rank: "2nd",
    rankTone: "up",
    reward: "€180",
    participants: ["AM", "SA", "NF", "YK"],
  },
  {
    id: "one-take-city",
    scope: "Local",
    time: "Ongoing",
    title: "One-take City",
    brief: "Make your city feel impossible to scroll past.",
    rank: "5th",
    rankTone: "up",
    reward: "€120",
    participants: ["LT", "OA", "HM", "RK"],
  },
  {
    id: "sound-of-home",
    scope: "Global",
    time: "Tomorrow",
    title: "The Sound of Home",
    brief: "Turn one familiar sound into a story people remember.",
    rank: "—",
    rankTone: "steady",
    reward: "€250",
    participants: ["YA", "MN", "RB"],
  },
];
