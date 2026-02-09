import { z } from "zod";

/**
 * Indian phone number validation (10 digits, starts with 6-9)
 */
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");

/**
 * Indian pincode validation (6 digits)
 */
export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Please enter a valid 6-digit pincode");

/**
 * GSTIN validation (15 characters)
 */
export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Please enter a valid GSTIN"
  )
  .optional()
  .or(z.literal(""));

/**
 * Address form schema
 */
export const addressSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  addressLine1: z.string().min(5, "Address must be at least 5 characters"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: pincodeSchema,
});

export type AddressFormValues = z.infer<typeof addressSchema>;

/**
 * Indian states list
 */
export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];
