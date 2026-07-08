export interface FindByPageResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
    random?: boolean;
  };
}
