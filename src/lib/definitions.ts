export type Article = {
  id: number;
  model: string;
  designation: string;
  type: "HARDWARE" | "CONSUMABLE";
  items?: Item[];
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
};

export type Structure = {
  id: number;
  name: string;
  chefId?: number;
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

export type User = {
  id: number;
  username: string;
  name: string;
};
