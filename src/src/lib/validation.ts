import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Вкажіть коректний email").transform((value) => value.toLowerCase()),
  nickname: z.string().trim().min(3, "Мінімум 3 символи").max(24, "Максимум 24 символи"),
  password: z
    .string()
    .min(8, "Пароль має містити щонайменше 8 символів")
    .regex(/[A-ZА-ЯІЇЄ]/, "Додайте велику літеру")
    .regex(/[0-9]/, "Додайте цифру")
});

export const loginSchema = z.object({
  email: z.email("Вкажіть коректний email").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Вкажіть пароль")
});

export const promoCreateSchema = z.object({
  code: z.string().trim().min(3).max(32).regex(/^[A-Z0-9_-]+$/i).transform((value) => value.toUpperCase()),
  rewardType: z.enum(["coins", "wheel_tickets"]),
  rewardAmount: z.number().int().positive().max(100000),
  maxUses: z.number().int().positive().max(100000),
  maxUsesPerUser: z.number().int().positive().max(100),
  startsAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  active: z.boolean().default(true)
});

export const promoRedeemSchema = z.object({
  code: z.string().trim().min(3).max(32).transform((value) => value.toUpperCase())
});

