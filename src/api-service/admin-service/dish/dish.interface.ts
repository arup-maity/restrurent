export interface Taxonomy {
   id: number;
   name: string;
   slug: string;
   description: string;
   thumbnail: string;
   type: string;
   parentId: number | null;
   createdAt: string;
   updatedAt: string;
}

export interface Category {
   id: number;
   dishId: number;
   taxonomyId: number;
   taxonomy: Taxonomy;
}

export interface DishResponseType {
   id: number;
   title: string;
   slug: string;
   description: string;
   shortDescription: string;
   price: number;
   costPrice: number;
   thumbnail: string;
   nonVeg: boolean;
   createdAt: string;
   updatedAt: string;
   categories: Category[];
}

export interface Pagination {
   total: number;
   page: number;
   pageSize: number;
   totalPages: number;
}

export interface PaginatedResponse<T> {
   dishes: T[];
   pagination: Pagination;
}
