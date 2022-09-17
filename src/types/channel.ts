import type { WithId, Document } from "mongodb";

export interface Channel extends WithId<Document> {
  id: string;
  users: string[];
}
