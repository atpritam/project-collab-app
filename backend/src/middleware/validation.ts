import Joi from "joi";
import { Request, Response, NextFunction } from "express";

// validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail: any) => detail.message)
        .join(", ");

      return res.status(400).json({
        error: "Validation Error",
        message: errorMessage,
        details: error.details.map((detail: any) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    next();
  };
};

// auth validation
export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().min(8).max(128).required(),
    name: Joi.string().min(1).max(100).required().trim(),
  }),

  login: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().required().max(128),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().max(255),
    password: Joi.string().min(8).max(128).required(),
  }),
  validateResetToken: Joi.object({
    token: Joi.string().required().max(255).trim(),
  }),
};

export const messageValidation = {
  send: Joi.object({
    senderId: Joi.string().required(),
    receiverId: Joi.string().required(),
    content: Joi.string().min(1).max(1000).required().trim(),
  }),
};

// Sanitize HTML content
export const sanitizeHtml = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === "string") {
      // removal of script tags and dangerous attributes
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }
    if (typeof value === "object" && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  next();
};
