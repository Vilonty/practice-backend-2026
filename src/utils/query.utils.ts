import { Op, Order } from 'sequelize';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Получение параметров пагинации из запроса
 */
export const getPaginationParams = (query: any): { page: number; limit: number } => {
  // Страница по умолчанию - 1, минимум 1
  const page = Math.max(1, parseInt(query.page) || 1);
  
  // Лимит по умолчанию - 10, минимум 1, максимум 100
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  
  return { page, limit };
};

/**
 * Получение мета-информации для пагинации
 */
export const getPaginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Получение параметров сортировки для Sequelize
 */
export const getSortingParams = (
  query: any, 
  defaultSort: Order = [['date', 'DESC']]
): Order => {
  const { sortBy, sortOrder } = query;
  
  // Если нет параметров сортировки, возвращаем сортировку по умолчанию
  if (!sortBy) {
    return defaultSort;
  }
  
  // Разрешенные поля для сортировки (безопасность)
  const allowedFields = ['id', 'date', 'start_time', 'end_time', 'created_at', 'rating', 'name', 'capacity'];
  
  // Проверяем, разрешено ли поле для сортировки
  if (!allowedFields.includes(sortBy)) {
    return defaultSort;
  }
  
  // Определяем порядок сортировки
  const order = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  // Возвращаем массив для Sequelize
  return [[sortBy, order]];
};