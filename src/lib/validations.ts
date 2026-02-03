import { z } from 'zod';

// Contact form validation
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(2000, 'Message must be less than 2000 characters'),
});

// Session creation validation
export const sessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Session title is required')
    .max(200, 'Title must be less than 200 characters'),
  clientName: z
    .string()
    .trim()
    .min(1, 'Client name is required')
    .max(100, 'Client name must be less than 100 characters'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

// Property address validation
export const propertySchema = z.object({
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .max(255, 'Address must be less than 255 characters'),
  city: z
    .string()
    .trim()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  state: z
    .string()
    .trim()
    .max(50, 'State must be less than 50 characters')
    .optional(),
  zipCode: z
    .string()
    .trim()
    .max(20, 'Zip code must be less than 20 characters')
    .optional(),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(1000000000, 'Price exceeds maximum')
    .optional(),
  beds: z
    .number()
    .int()
    .min(0, 'Beds cannot be negative')
    .max(100, 'Beds exceeds maximum')
    .optional(),
  baths: z
    .number()
    .min(0, 'Baths cannot be negative')
    .max(100, 'Baths exceeds maximum')
    .optional(),
  sqft: z
    .number()
    .int()
    .min(0, 'Sqft cannot be negative')
    .max(1000000, 'Sqft exceeds maximum')
    .optional(),
});

// Profile validation
export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone must be less than 30 characters')
    .optional(),
  slogan: z
    .string()
    .trim()
    .max(200, 'Slogan must be less than 200 characters')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(2000, 'Bio must be less than 2000 characters')
    .optional(),
  license_number: z
    .string()
    .trim()
    .max(50, 'License number must be less than 50 characters')
    .optional(),
  brokerage_name: z
    .string()
    .trim()
    .max(100, 'Brokerage name must be less than 100 characters')
    .optional(),
  brokerage_address: z
    .string()
    .trim()
    .max(255, 'Address must be less than 255 characters')
    .optional(),
  brokerage_phone: z
    .string()
    .trim()
    .max(30, 'Phone must be less than 30 characters')
    .optional(),
  brokerage_email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  instagram_url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  facebook_url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  twitter_url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  youtube_url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  website_url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

// Property details editing validation
export const propertyDetailsSchema = z.object({
  summary: z
    .string()
    .trim()
    .max(500, 'Summary must be less than 500 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  agentNotes: z
    .string()
    .trim()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
});

// Feedback form validation
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(10),
  topThingsLiked: z
    .string()
    .trim()
    .max(1000, 'Text must be less than 1000 characters')
    .optional(),
  concerns: z
    .string()
    .trim()
    .max(1000, 'Text must be less than 1000 characters')
    .optional(),
  layoutThoughts: z
    .string()
    .trim()
    .max(1000, 'Text must be less than 1000 characters')
    .optional(),
  neighborhoodThoughts: z
    .string()
    .trim()
    .max(1000, 'Text must be less than 1000 characters')
    .optional(),
  conditionConcerns: z
    .string()
    .trim()
    .max(1000, 'Text must be less than 1000 characters')
    .optional(),
  investigateRequest: z
    .string()
    .trim()
    .max(1000, 'Text must be less than 1000 characters')
    .optional(),
});

// URL validation helper
export const isValidUrl = (url: string): boolean => {
  try {
    if (!url.trim()) return true; // Empty is ok
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Listing URL validation
export const listingUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .url('Please enter a valid URL')
    .refine(
      (url) => {
        const lowercaseUrl = url.toLowerCase();
        return !lowercaseUrl.includes('redfin.com') && !lowercaseUrl.includes('zillow.com');
      },
      'Redfin and Zillow URLs are not supported'
    ),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type SessionFormData = z.infer<typeof sessionSchema>;
export type PropertyFormData = z.infer<typeof propertySchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type PropertyDetailsFormData = z.infer<typeof propertyDetailsSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;
