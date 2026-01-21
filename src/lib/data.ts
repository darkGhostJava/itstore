

import { api } from './api';
import type { Article, Item, Person, Structure, Operation, Distribution, Stats } from './definitions';

type PaginatedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;

};

export const getStats = async (): Promise<Stats> => {
  const response = await api.get('/stats');
  console.log(response);

  return response.data;
}

export const fetchArticles = async (options: { pageIndex: number; pageSize: number; query?: string; type?: 'HARDWARE' | 'CONSUMABLE', sort?: string; }) => {
  const { pageIndex, pageSize, query, type, sort } = options;

  const response = await api.get<PaginatedResponse<Article>>("/articles", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      type: type || undefined,
      sort: sort,
    },
  });

  return {
    data: response.data.content as Article[],
    pageCount: response.data.totalPages,
    page: response.data.page,
    size: response.data.size,
    totalElements: response.data.totalElements,
  };
};
export const fetchItemsInStock = async ( options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
  const { pageIndex, pageSize, query, sort } = options;
  
  const response = await api.get<PaginatedResponse<Article>>(`/items/search/in-stock`, {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });
  
  return {
    data: response.data.content as Article[],
    pageCount: response.data.totalPages,
  };
}

export const fetchItems = async (type: 'HARDWARE' | 'CONSUMABLE', options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
  const { pageIndex, pageSize, query, sort } = options;
  
  const response = await api.get<PaginatedResponse<Item>>(`/items/search`, {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      type: type,
      sort: sort,
    },
  });
  
  return {
    data: response.data.content as Item[],
    pageCount: response.data.totalPages,
  };
}

export const getAllArticles = async () => {
  const response = await api.get<Article[]>("/articles/all");
  return {
    data: response.data as Article[],
  };
};

export const getArticlesInStockCons = async (): Promise<Record<string, number>> => {
    const response = await api.get<Record<string, number>>("/articles/in-stock/consumables");
    return response.data;
}
export const getArticlesInStockMateriel= async (): Promise<Record<string, number>> => {
    const response = await api.get<Record<string, number>>("/articles/in-stock/materiels");
    return response.data;
}
export const getAllDirections = async () => {
  const response = await api.get<Structure[]>("/structures/directions");
  return {
    data: response.data as Structure[],
  };
};

export const getSubDirectionsOfDirection = async (directionId: number) => {
  const response = await api.get<Structure[]>(`/structures/sub_directions/${directionId}`);
  return {
    data: response.data as Structure[],
  };
};

export const getPersonsByIdStructure = async (idStructure: number): Promise<Person[]> => {
  const response = await api.get<any>(`/persons/structure/${idStructure}`);
  // The backend might return a raw array or a paginated object. This handles both.
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (response.data && Array.isArray(response.data.content)) {
    return response.data.content;
  }
  return [];
};

export async function searchArticles(query: string, type: string | "ALL") {
  if (!query) return { data: [] };
  const res = await api.get(`/articles/searchByName/${encodeURIComponent(type)}/${encodeURIComponent(query)}`);
  return res;
}

export async function searchItems(serialNumber: string): Promise<Item[]> {
  if (serialNumber.length < 2) return [];
  const res = await api.get<Item[]>(`/items/search/${serialNumber}`);
  return res.data;
}


export async function searchItemsBySerialNumber(serialNumber: string, articleId: number) {
  const res = await api.get(`/items/search/${articleId}/${serialNumber}`);
  return res.data;
}

export async function searchItemsBySerialNumberAndPerson(personId: number, serialNumber: string): Promise<Item[]> {
  if (serialNumber.length < 2) return [];
  const res = await api.get<Item[]>(`/items/search/person/distributed/${personId}/${serialNumber}`);
  return res.data;
}

export const fetchOperations = async (options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Operation>>("/operations", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages
  };
}

export const fetchAllOperations = async () => {
  const response = await api.get<Operation[]>('/operations/all');
  return response.data;
}

export const fetchPersons = async (options: { pageIndex: number; pageSize: number; query?: string; sort?:string, structureId?: string }) => {
  const { pageIndex, pageSize, query, sort, structureId } = options;
  const response = await api.get<PaginatedResponse<Person>>("/persons", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
      structureId: structureId || undefined,
    },
  });

  return {
    data: response.data.content as Person[],
    pageCount: response.data.totalPages,
    page: response.data.page,
    size: response.data.size,
    totalElements: response.data.totalElements,
  };
};

export const searchPersons = async (query: string, structureId: string) => {
  const response = await api.get<Person[]>("/persons/searchInStructure", {
    params: {
      query: query,
      structureId: structureId,
    }
  });
  return {
    data: response.data as Person[],
  };
}

export const fetchPersonById = async (id: number): Promise<Person> => {
  const response = await api.get<Person>(`/persons/${id}`);
  return response.data;
}

export const fetchStructures = async (options: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Structure>>("/structures", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });

  return {
    data: response.data.content as Structure[],
    pageCount: response.data.totalPages,
    page: response.data.page,
    size: response.data.size,
    totalElements: response.data.totalElements,
  };
};

export const fetchStructureTree = async (): Promise<Structure> => {
  const response = await api.get<Structure>("/structures/tree");
  return response.data;
};

export const fetchAllStructures = async (): Promise<Structure[]> => {
  const response = await api.get<Structure[]>("/structures/all");
  return response.data;
}

export const fetchStructureById = async (id: number): Promise<Structure> => {
    const response = await api.get<Structure>(`/structures/${id}`);
    return response.data;
}

export const fetchItemsForArticle = async (articleId: number, options: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Item>>(`/items/article/${articleId}`, {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages,
  };
}

export const fetchAllItems = async () => {
  const response = await api.get<Item[]>('/items/all');
  return response.data;
}

export const fetchItemsForPerson = async (personId: number, options: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Item>>(`/items/person/${personId}`, {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages,
  };
}

export const fetchItemsForStructure = async (structureId: number, options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
    const { pageIndex, pageSize, query, sort } = options;
    const response = await api.get<PaginatedResponse<Item>>(`items/structure/${structureId}`, {
        params: {
        page: pageIndex,
        size: pageSize,
        query: query || undefined,
        sort: sort,
        },
    });
    return {
        data: response.data.content,
        pageCount: response.data.totalPages,
    };
}

export const fetchArrivals = async (options: { pageIndex: number; pageSize: number; query?: string; sort?: string; }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Operation>>("/arrivals", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages
  };
}

export const fetchDistributions = async (options: { pageIndex: number; pageSize: number; query?: string; sort?:string; }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Distribution>>("/distributions", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });

  return {
    data: response.data.content as Distribution[],
    pageCount: response.data.totalPages,
  };
}

export const fetchReparations = async (options: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
  const { pageIndex, pageSize, query, sort } = options;
  const response = await api.get<PaginatedResponse<Operation>>("/reparations", {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      sort: sort,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages
  };
}

export const registerReparations = async (payload: { itemId: number; remarks: string; userId: number; }[]) => {

  const response = await api.post("/reparations", payload, {
    responseType: "arraybuffer",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `decharge_${Date.now()}.pdf`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return response;

}

export const markItemAsRepaired = async (itemId: number, userId: number) => {

  const response = await api.put(`/items/repaired/${itemId}/${userId}`, null, {
    responseType: "arraybuffer",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `decharge_${Date.now()}.pdf`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return response;

}

export const markItemAsReformed = async (itemId: number, userId: number) => {
  const response = await api.put(`/items/reformed/${itemId}/${userId}`, null, {
    responseType: "arraybuffer",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `decharge_${Date.now()}.pdf`;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return response;
}

export const fetchItemById = async (id: number): Promise<Item> => {
  const response = await api.get<Item>(`/items/${id}`);
  return response.data;
}

export const fetchOperationsForItem = async (itemId: number, options: { pageIndex: number; pageSize: number; query?: string; sort?:string }) => {
  const { pageIndex, pageSize, query, sort } = options;
  console.log(itemId);
  
  const response = await api.get<PaginatedResponse<Operation>>(`/items/operations`, {
    params: {
      page: pageIndex,
      size: pageSize,
      query: query || undefined,
      itemId:itemId,
      sort: sort,
    },
  });
  console.log(response.statusText);
  
  return {
    data: response.data.content,
    pageCount: response.data.totalPages,
  };
}

export const getStructureDistributionStats = async (params: { from?: string; to?: string }): Promise<Record<string, Record<string, number>>> => {
  const response = await api.get("stats/structures/distribution", { params });
  return response.data;
};

    



