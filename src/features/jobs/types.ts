export type JobLevel = "junior" | "mid" | "senior";

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  level: JobLevel;
}