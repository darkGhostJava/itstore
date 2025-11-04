export type Article = {
  id: number;
  model: string;
  designation: string;
  type: "HARDWARE" | "CONSUMABLE";
  quantity: number;
};

export type Item = {
  id: number;
  serialNumber: string;
  article: Article;
  status: "IN_STOCK" | "DISTRIBUTED" | "UNDER_REPAIR" | "REFORMED";
};

export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  grade: string;
  matricule: string;
  structure: Structure;
  function: string;
};

export type Structure = {
  id: number;
  name: string;
  chef?: Person;
  parentId?: number;
};

export type Operation = {
  id: number;
  type: "ARRIVAL" | "DISTRIBUTION" | "REPARATION" | "REVERSEMENT" | "REFORME";
  date: string;
  remarks: string;
  user: User;
  beneficiary?: Person;
};

export type Distribution = {
  id: number;
  date: string;
  remarks: string;
  item: Item;
  person: Person;
  user: User;
  hasAttestation: boolean;
}

export type User = {
  id: number;
  username: string;
  name: string;
};

export type Stats = {
  totalArticles: number;
  itemsInStock: number;
  distributedItems: number;
  underRepair: number;
  structuresCount: number;
}