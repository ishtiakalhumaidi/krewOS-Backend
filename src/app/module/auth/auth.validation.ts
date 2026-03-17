import z from "zod";

export const createPublicMember = z.object({
  companyName: z
    .string("Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be at most 100 characters"),

  name: z
    .string("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be at most 30 characters"),

  email: z.email("Invalid email format"),

  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be at most 50 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
});

export const createCompanyMember = z.object({
  email: z.email("Invalid email format"),

  role: z.enum(["ADMIN", "MEMBER", "MANAGER"], {
    message: "Role must be ADMIN, MEMBER or MANAGER",
  }),

  companyId: z
    .uuid("Invalid company ID format"),
});


export const acceptInviteSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required"),

  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be at most 50 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
});

export const loginSchema = z.object({
  email: z
    .email("Invalid email"),

  password: z
    .string()
    .min(1, "Password is required"),
});