import { describe, expect, it } from "vitest";
import { promoCreateSchema, registerSchema } from "./validation";

describe("registerSchema", () => {
  it("normalizes email and accepts a strong password", () => {
    const result = registerSchema.parse({
      email: "PLAYER@EXAMPLE.COM",
      nickname: "Bazuka",
      password: "Strong123"
    });
    expect(result.email).toBe("player@example.com");
  });

  it("rejects a weak password", () => {
    expect(() =>
      registerSchema.parse({
        email: "player@example.com",
        nickname: "Bazuka",
        password: "password"
      })
    ).toThrow();
  });
});

describe("promoCreateSchema", () => {
  it("normalizes promo codes", () => {
    const result = promoCreateSchema.parse({
      code: "tavi-2026",
      rewardType: "coins",
      rewardAmount: 100,
      maxUses: 50,
      maxUsesPerUser: 1,
      startsAt: "2026-07-23T10:00:00.000Z",
      expiresAt: "2026-08-23T10:00:00.000Z",
      active: true
    });
    expect(result.code).toBe("TAVI-2026");
  });
});

