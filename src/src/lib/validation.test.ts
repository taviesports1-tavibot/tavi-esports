import { describe, expect, it } from "vitest";
import { promoCreateSchema, registerSchema, teamCreateSchema, tournamentRegistrationSchema } from "./validation";

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

describe("teamCreateSchema", () => {
  const roster = Array.from({ length: 5 }, (_, index) => ({
    nickname: `Player ${index + 1}`,
    mlbbId: `1000${index}`,
    mlbbServer: `200${index}`,
    role: ["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam"][index]
  }));

  it("accepts a complete unique 5-player roster", () => {
    expect(teamCreateSchema.parse({ name: "TaVi Academy", tag: "TAVI", captainTelegram: "@bazuka_ml", roster }).roster).toHaveLength(5);
  });

  it("rejects duplicate MLBB ID and server pairs", () => {
    const duplicate = roster.map((player) => ({ ...player, mlbbId: "10001", mlbbServer: "2001" }));
    expect(() => teamCreateSchema.parse({ name: "TaVi Academy", tag: "TAVI", captainTelegram: "@bazuka_ml", roster: duplicate })).toThrow();
  });

  it("rejects a roster without all five starting roles", () => {
    const duplicateRole = roster.map((player, index) => ({ ...player, role: index === 4 ? "Jungle" : player.role }));
    expect(() => teamCreateSchema.parse({ name: "TaVi Academy", tag: "TAVI", captainTelegram: "@bazuka_ml", roster: duplicateRole })).toThrow();
  });
});

describe("tournamentRegistrationSchema", () => {
  it("accepts an existing team id", () => {
    expect(tournamentRegistrationSchema.parse({ teamId: "550e8400-e29b-41d4-a716-446655440000" }).teamId).toBe("550e8400-e29b-41d4-a716-446655440000");
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
