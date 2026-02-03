
export type Article = {
  id: number;
  model: string;
  designation: string;
  type: "HARDWARE" | "CONSUMABLE";
  category: string;
  quantity: number;
  budget?: string;
};

export type Item = {
  id: number;
  serialNumber: string;
  article: Article;
  status: "IN_STOCK_NEW" | "IN_STOCK" | "DISTRIBUTED" | "UNDER_REPAIR" | "REFORMED" | "REPAIRED";
  budget?: string;
  date?: string;
};

export type PersonFunction = 
  | "DIRECTEUR_GENERALE"
  | "DIRECTEUR"
  | "SOUS_DIRECTEUR"
  | "CHARGEE_DE_DOSSIER"
  | "SECRITEUR";

export type Person = {
  id: number;
  firstName?: string;
  lastName?: string;
  grade?: string;
  matricule?: string;
  pseudo?: string;
  structure?: Structure;
  structureId?: number;
  function: PersonFunction;
};

export type Structure = {
  id: number;
  name: string;
  chef?: Person;
  children?: Structure[];
  materielCount?: number;
  consCount?: number;
  parent?: Structure;
};

export type Operation = {
  id: number;
  type: "ARRIVAL" | "DISTRIBUTION" | "REPAIR" | "REPAIRED" | "REVERSEMENT" | "REFORME";
  date: string;
  remarks: string;
  user: User;
  person?: Person;
};

export type Distribution = {
  id: number;
  date: string;
  remarks: string;
  item: Item;
  person: Person;
  user: User;
  isSigned: boolean;
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
  repaired: number;
  structuresCount: number;
  reformed: number;
}
