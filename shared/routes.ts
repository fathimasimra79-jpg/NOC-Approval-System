import { z } from 'zod';
import { insertUserSchema, insertNocRequestSchema, users, nocRequests } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Response models
export const userResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  rollNumber: z.string().nullable(),
  department: z.string().nullable(),
  year: z.string().nullable(),
  email: z.string(),
  role: z.string(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: userResponseSchema,
});

export const nocRequestResponseSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  companyName: z.string(),
  duration: z.string(),
  reason: z.string(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  pdfPath: z.string().nullable(),
  createdAt: z.string().or(z.date()).nullable(),
  student: userResponseSchema.optional()
});

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: authResponseSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: authResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    adminLogin: {
      method: 'POST' as const,
      path: '/api/auth/admin-login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: authResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  noc: {
    apply: {
      method: 'POST' as const,
      path: '/api/noc/apply' as const,
      input: insertNocRequestSchema,
      responses: {
        201: nocRequestResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    myRequests: {
      method: 'GET' as const,
      path: '/api/noc/my-requests' as const,
      responses: {
        200: z.array(nocRequestResponseSchema),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    requests: {
      method: 'GET' as const,
      path: '/api/admin/requests' as const,
      responses: {
        200: z.array(nocRequestResponseSchema),
        401: errorSchemas.unauthorized,
      },
    },
    approve: {
      method: 'PUT' as const,
      path: '/api/admin/approve/:id' as const,
      responses: {
        200: nocRequestResponseSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    reject: {
      method: 'PUT' as const,
      path: '/api/admin/reject/:id' as const,
      input: z.object({ rejectionReason: z.string() }),
      responses: {
        200: nocRequestResponseSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
