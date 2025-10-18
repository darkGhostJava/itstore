import type { Article, Item, Person, Structure, Operation, User } from './definitions';

export const mockUsers: User[] = [
  { id: 1, username: 'jdoe', name: 'John Doe' },
  { id: 2, username: 'asmith', name: 'Anna Smith' },
];

export const mockStructures: Structure[] = [
  { id: 1, name: 'Direction Générale', chefId: 1 },
  { id: 2, name: 'Département IT', parentId: 1, chefId: 2 },
  { id: 3, name: 'Département RH', parentId: 1, chefId: 3 },
  { id: 4, name: 'Service Réseau', parentId: 2 },
  { id: 5, name: 'Service Support', parentId: 2 },
];

export const mockPersons: Person[] = [
  { id: 1, firstName: 'Jean', lastName: 'Dupont', grade: 'Directeur', matricule: 'M001', structureId: 1 },
  { id: 2, firstName: 'Alice', lastName: 'Martin', grade: 'Chef de département', matricule: 'M002', structureId: 2 },
  { id: 3, firstName: 'Bob', lastName: 'Lefebvre', grade: 'Chef de département', matricule: 'M003', structureId: 3 },
  { id: 4, firstName: 'Charlie', lastName: 'Bernard', grade: 'Technicien', matricule: 'T011', structureId: 4 },
  { id: 5, firstName: 'Diana', lastName: 'Petit', grade: 'Technicienne', matricule: 'T012', structureId: 5 },
  { id: 6, firstName: 'Eve', lastName: 'Robert', grade: 'Stagiaire', matricule: 'S020', structureId: 5 },
];

export const mockArticles: Article[] = [
  { id: 1, model: 'Dell Latitude 7490', designation: 'Laptop', type: 'HARDWARE' },
  { id: 2, model: 'HP LaserJet Pro M404dn', designation: 'Printer', type: 'HARDWARE' },
  { id: 3, model: 'Logitech MK270', designation: 'Keyboard/Mouse Combo', type: 'HARDWARE' },
  { id: 4, model: 'HP 58A', designation: 'Toner Cartridge', type: 'CONSUMABLE' },
  { id: 5, model: 'A4 Paper Ream', designation: 'Paper', type: 'CONSUMABLE' },
];

export const mockItems: Item[] = [
  // Laptops (Article 1)
  { id: 101, serialNumber: 'LT-DELL-001', articleId: 1, status: 'IN_STOCK' },
  { id: 102, serialNumber: 'LT-DELL-002', articleId: 1, status: 'DISTRIBUTED' },
  { id: 103, serialNumber: 'LT-DELL-003', articleId: 1, status: 'UNDER_REPAIR' },
  { id: 104, serialNumber: 'LT-DELL-004', articleId: 1, status: 'IN_STOCK' },
  { id: 105, serialNumber: 'LT-DELL-005', articleId: 1, status: 'REFORMED' },

  // Printers (Article 2)
  { id: 201, serialNumber: 'PR-HP-001', articleId: 2, status: 'DISTRIBUTED' },
  { id: 202, serialNumber: 'PR-HP-002', articleId: 2, status: 'IN_STOCK' },

  // Keyboards (Article 3)
  { id: 301, serialNumber: 'KB-LOGI-001', articleId: 3, status: 'DISTRIBUTED' },
  { id: 302, serialNumber: 'KB-LOGI-002', articleId: 3, status: 'DISTRIBUTED' },
  { id: 303, serialNumber: 'KB-LOGI-003', articleId: 3, status: 'IN_STOCK' },
];

// Add items to articles
mockArticles.forEach(article => {
  article.items = mockItems.filter(item => item.articleId === article.id);
});


export const mockOperations: Operation[] = [
  { id: 1, type: 'ARRIVAL', date: '2023-10-01T10:00:00Z', remarks: 'New shipment of laptops', itemIds: [101, 104], userId: 1 },
  { id: 2, type: 'DISTRIBUTION', date: '2023-10-02T14:30:00Z', remarks: 'For new technician', itemIds: [102], beneficiaryId: 4, userId: 2 },
  { id: 3, type: 'REPARATION', date: '2023-10-05T09:15:00Z', remarks: 'Screen issue', itemIds: [103], userId: 1 },
  { id: 4, type: 'REVERSEMENT', date: '2023-11-10T11:00:00Z', remarks: 'Employee departure', itemIds: [], userId: 2 },
  { id: 5, type: 'REFORME', date: '2023-11-20T16:45:00Z', remarks: 'Obsolete hardware', itemIds: [105], userId: 1 },
  { id: 6, type: 'ARRIVAL', date: '2023-12-01T11:00:00Z', remarks: 'Printer restocking', itemIds: [202], userId: 1 },
  { id: 7, type: 'DISTRIBUTION', date: '2023-12-03T15:00:00Z', remarks: 'Office printer setup', itemIds: [201], beneficiaryId: 3, userId: 2 },
  { id: 8, type: 'DISTRIBUTION', date: '2024-01-15T10:30:00Z', remarks: '', itemIds: [301, 302], beneficiaryId: 5, userId: 2 },
];
