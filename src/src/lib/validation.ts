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

export const rosterPlayerSchema = z.object({
  nickname: z.string().trim().min(2, "Вкажіть нікнейм").max(32),
  mlbbId: z.string().trim().min(3, "Вкажіть MLBB ID").max(40),
  role: z.enum(["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam", "Substitute"])
});

export const tournamentRegistrationSchema = z.object({
  teamName: z.string().trim().min(3).max(40),
  tag: z.string().trim().min(2).max(6).regex(/^[\p{L}\p{N}_-]+$/u),
  captainTelegram: z.string().trim().regex(/^@[A-Za-z0-9_]{5,32}$/, "Вкажіть Telegram у форматі @username"),
  roster: z.array(rosterPlayerSchema).min(5).max(7).refine(
    (players) => new Set(players.map((player) => player.mlbbId.toLowerCase())).size === players.length,
    "MLBB ID у складі не повинні повторюватися"
  )
});

export const registrationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
  seed: z.number().int().positive().max(256).optional()
});

export const stageGenerationSchema = z.object({ phase: z.enum(["qualification", "groups", "playoff"]) });

export const matchUpdateSchema = z.object({
  scoreOne: z.number().int().min(0).max(4),
  scoreTwo: z.number().int().min(0).max(4),
  scheduledAt: z.iso.datetime().nullable().optional(),
  complete: z.boolean().default(false)
});
