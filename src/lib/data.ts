
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

export const fetchArticles = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;

  const response = await api.get<PaginatedResponse<Article>>("/articles", {
    params: {
      page: pageIndex,
      size: pageSize,
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

export const getAllArticles = async () => {
  const response = await api.get<Article[]>("/articles/all");
  return {
    data: response.data as Article[],
  };
};

export const getAllDirections = async () => {
  const response = await api.get<Structure[]>("/structures/directions");
  return {
    data: response.data as Structure[],
  };
};

export const getSubDirectionsOfDirection = async (directionId:number) => {
  const response = await api.get<Structure[]>(`/structures/sub_directions/${directionId}`);
  return {
    data: response.data as Structure[],
  };
};

export const getPersonsByIdStructure = async (idStructure: number) => {
  const response = await api.get<Person[]>(`/persons/structure/${idStructure}/all`);
  return {
    data: response.data as Person[],
  };
};

export async function searchArticles(query: string,type:string | "ALL") {
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
  const res = await api.get<Item[]>(`/items/search/person/${personId}/${serialNumber}`);
  return res.data;
}

export const fetchOperations = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;
  const response = await api.get<PaginatedResponse<Operation>>("/operations", {
    params: {
      page: pageIndex,
      size: pageSize,
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

export const fetchPersons = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;
  const response = await api.get<PaginatedResponse<Person>>("/persons", {
    params: {
      page: pageIndex,
      size: pageSize,
    },
  });

  return {
    data: response.data.content as Person[],
    pageCount: response.data.totalPages,
    page: response.data.page,
    size: response.data.size,
    totalElements: response.data.totalElements,
  };
}

export const fetchStructures = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;
  const response = await api.get<PaginatedResponse<Structure>>("/structures", {
    params: {
      page: pageIndex,
      size: pageSize,
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

export const fetchItemsForArticle = async (articleId: number, options: { pageIndex: number; pageSize: number }) => {
    const { pageIndex, pageSize } = options;
    const response = await api.get<PaginatedResponse<Item>>(`/items/article/${articleId}`, {
        params: {
            page: pageIndex,
            size: pageSize,
        },
    });
    return {
        data: response.data.content,
        pageCount: response.data.totalPages,
    };
}

export const fetchArrivals = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;
  const response = await api.get<PaginatedResponse<Operation>>("/arrivals", {
    params: {
      page: pageIndex,
      size: pageSize,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages
  };
}

export const fetchDistributions = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;
  const response = await api.get<PaginatedResponse<Distribution>>("/distributions", {
    params: {
      page: pageIndex,
      size: pageSize,
    },
  });

  return {
    data: response.data.content as Distribution[],
    pageCount: response.data.totalPages,
  };
}

export const fetchReparations = async (options: { pageIndex: number; pageSize: number }) => {
  const { pageIndex, pageSize } = options;
  const response = await api.get<PaginatedResponse<Operation>>("/reparations", {
    params: {
      page: pageIndex,
      size: pageSize,
    },
  });
  return {
    data: response.data.content,
    pageCount: response.data.totalPages
  };
}

export const registerReparations = async (payload: { itemId: number; remarks: string; userId: number; }[]) => {
  return await api.post("/reparations", payload);
}

export const markItemAsRepaired = async (itemId: number, userId: number) => {
  return await api.put(`/items/${itemId}/repaired`, null, { params: { userId } });
}

export const markItemAsReformed = async (itemId: number, userId: number) => {
  return await api.put(`/items/${itemId}/reformed`, null, { params: { userId } });
}
    
