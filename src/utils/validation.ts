import { z } from 'zod'

// 1. Customer Schemas
export const CustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20),
  guarantor: z.string().min(2, 'Guarantor name is required'),
  guarantor_phone: z.string().min(8, 'Guarantor phone is required').max(20),
  tank_number: z.string().min(1, 'Tank Number / Box ID is required').max(50),
  staff_id: z.string().uuid('Invalid staff ID'),
})

// 2. Sale Schemas
export const SaleItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  free_quantity: z.number().int().min(0).optional().default(0),
})

export const SaleSchema = z.object({
  customer_id: z.string().uuid(),
  sale_type: z.enum(['cash', 'credit', 'free']),
  items: z.array(SaleItemSchema).min(1, 'At least one item is required'),
  total_amount: z.number().min(0),
})

// 3. Payment Schemas
export const PaymentSchema = z.object({
  sale_id: z.string().uuid(),
  amount: z.number().positive('Amount must be greater than 0'),
  payment_method: z.string().default('cash'),
})

// 4. Submission Schemas
export const SubmissionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
})

export const ReviewSubmissionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'verified', 'disputed']),
  submitted_amount: z.number().min(0).optional(),
  note: z.string().max(500).optional(),
})

// 5. Distribution Schemas
export const DistributionSchema = z.object({
  staff_id: z.string().uuid(),
  item_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  free_quantity: z.number().int().min(0).optional().default(0),
  zone: z.string().max(100).optional(),
})
