import { Filter } from "bad-words";

export const validateContent = (content: string, title: string) => {
  const filter = new Filter();
  if (filter.isProfane(content)) {
    return { valid: false, mssg: `${title} contains inappropriate language` };
  }
  return { valid: true, mssg: `${title} is appropriate` };
};
