import { describe, expect, it } from "vitest";
import { calculateStandings, createGroups, createPlayoff, createQualification, placeMatch, type TournamentSeed } from "./tournament-engine";

const teams = (count: number): TournamentSeed[] =>
  Array.from({ length: count }, (_, index) => ({ id: `team-${index + 1}`, name: `Team ${index + 1}`, seed: index + 1 }));

describe("large tournament engine", () => {
  it("reduces any supported field to sixteen qualification winners", () => {
    expect(createQualification(teams(16))).toHaveLength(0);
    expect(createQualification(teams(32))).toHaveLength(16);
    expect(createQualification(teams(64))).toHaveLength(48);
    expect(createQualification(teams(256))).toHaveLength(240);
  });

  it("creates four balanced groups and twenty-four BO1 matches", () => {
    const groups = createGroups(teams(16));
    expect(groups).toHaveLength(4);
    expect(groups.every((group) => group.members.length === 4)).toBe(true);
    expect(groups.flatMap((group) => group.matches)).toHaveLength(24);
    expect(groups.flatMap((group) => group.matches).every((match) => match.bestOf === 1)).toBe(true);
  });

  it("sorts a group by points, map difference and seed", () => {
    const members = teams(4);
    const table = calculateStandings(members, [
      { registrationId: "team-1", opponentRegistrationId: "team-2", score: 1, opponentScore: 0 },
      { registrationId: "team-2", opponentRegistrationId: "team-1", score: 0, opponentScore: 1 },
      { registrationId: "team-3", opponentRegistrationId: "team-4", score: 1, opponentScore: 0 },
      { registrationId: "team-4", opponentRegistrationId: "team-3", score: 0, opponentScore: 1 }
    ]);
    expect(table.map((team) => team.id)).toEqual(["team-1", "team-3", "team-2", "team-4"]);
  });

  it("builds playoffs with medal and fifth-place matches", () => {
    const groups = createGroups(teams(16));
    const standings = Object.fromEntries(groups.map((group) => [group.name, calculateStandings(group.members, [])]));
    const playoff = createPlayoff(standings);
    expect(playoff).toHaveLength(11);
    expect(playoff.find((match) => match.key === "PO-FINAL")?.bestOf).toBe(5);
    expect(playoff.find((match) => match.key === "PO-BRONZE")).toBeTruthy();
    expect(playoff.find((match) => match.key === "PO-FIFTH")).toBeTruthy();
  });

  it("assigns all six prize places", () => {
    expect(placeMatch("PO-FINAL", "a", "b")).toEqual([{ place: 1, registrationId: "a" }, { place: 2, registrationId: "b" }]);
    expect(placeMatch("PO-BRONZE", "c", "d")[0].place).toBe(3);
    expect(placeMatch("PO-FIFTH", "e", "f")[1].place).toBe(6);
  });
});
