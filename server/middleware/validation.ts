import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../utils/errors.js";

// Generic validation middleware
export const validate = (schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
          received: 'received' in err ? err.received : undefined,
        }));
        
        next(new ValidationError("Request validation failed", details));
      } else {
        next(error);
      }
    }
  };
};

// Specific validation helpers
export const validateBody = (schema: AnyZodObject) => validate({ body: schema });
export const validateQuery = (schema: AnyZodObject) => validate({ query: schema });
export const validateParams = (schema: AnyZodObject) => validate({ params: schema });

// ID parameter validation (common pattern)
import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a positive integer").transform(Number),
});

export const validateIdParam = validateParams(idParamSchema);