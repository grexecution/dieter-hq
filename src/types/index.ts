/**
 * Global type definitions
 * 
 * Shared types used across the application
 */

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonEmptyArray<T> = [T, ...T[]];

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type ValueOf<T> = T[keyof T];

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncReturnType<T extends (...args: any) => Promise<any>> = UnwrapPromise<ReturnType<T>>;

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Common entity fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form state types
 */
export type FormState<T> = {
  data: T;
  errors?: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
};
