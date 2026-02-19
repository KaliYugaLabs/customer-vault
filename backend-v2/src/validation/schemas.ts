import { z } from 'zod';

export const customerSchema = z.object({
  idNumber: z.string()
    .length(13, 'ID number must be 13 digits')
    .regex(/^\d+$/, 'ID number must contain only digits'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name'),
  
  email: z.string()
    .email('Invalid email address'),
  
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]{10,20}$/, 'Invalid phone number')
    .optional().or(z.literal('')),
  
  address: z.string()
    .min(5, 'Address is too short')
    .max(500, 'Address is too long'),
    
  formattedAddress: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, 'Name is required').max(100)
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
