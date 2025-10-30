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
  articleId: number;
  status: "IN_STOCK" | "DISTRIBUTED" | "UNDER_REPAIR" | "REFORMED";
};

export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  grade: string;
  matricule: string;
  structureId: number;
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
  itemIds: number[];
  beneficiaryId?: number;
  userId: number;
};
export type Distribution = {
  id: number;
  date: string;
  remarks: string;
  item: Item;
  beneficiary: Person;
  user: User;
}

export type User = {
  id: number;
  username: string;
  name: string;
};
