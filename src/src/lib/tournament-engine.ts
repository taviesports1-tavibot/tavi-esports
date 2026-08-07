export type TournamentSeed = {
  id: string;
  name: string;
  seed: number;
};

export type MatchSource =
  | { type: "registration"; registrationId: string; label: string }
  | { type: "winner"; matchKey: string; label: string }
  | { type: "loser"; matchKey: string; label: string };

export type PlannedMatch = {
  key: string;
  stage: "qualification" | "groups" | "playoff" | "placement";
  round: number;
  order: number;
  bestOf: 1 | 3 | 5;
  group?: string;
  participantOne: MatchSource;
  participantTwo: MatchSource;
  winnerTo?: { matchKey: string; slot: 1 | 2 };
  loserTo?: { matchKey: string; slot: 1 | 2 };
};

export type GroupAssignment = {
  name: string;
  members: TournamentSeed[];
  matches: PlannedMatch[];
};

export type GroupResult = {
  registrationId: string;
  opponentRegistrationId: string;
  score: number;
  opponentScore: number;
};

export type Standing = TournamentSeed & {
  played: number;
  wins: number;
  losses: number;
  mapsWon: number;
  mapsLost: number;
  points: number;
};

const groupNames = ["A", "B", "C", "D"] as const;

function registrationSource(team: TournamentSeed): MatchSource {
  return { type: "registration", registrationId: team.id, label: team.name };
}

export function createQualification(teams: TournamentSeed[], target = 16): PlannedMatch[] {
  if (teams.length < target) throw new Error(`Потрібно щонайменше ${target} підтверджених команд`);
  if (teams.length === target) return [];
  if (teams.length > 256) throw new Error("Кваліфікація підтримує максимум 256 команд");

  const sorted = [...teams].sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
  const pools: TournamentSeed[][] = Array.from({ length: target }, () => []);

  sorted.forEach((team, index) => {
    const wave = Math.floor(index / target);
    const offset = index % target;
    const poolIndex = wave % 2 === 0 ? offset : target - 1 - offset;
    pools[poolIndex].push(team);
  });

  const matches: PlannedMatch[] = [];
  let order = 1;

  function buildPool(pool: TournamentSeed[], poolNumber: number): { source: MatchSource; depth: number } {
    if (pool.length === 1) return { source: registrationSource(pool[0]), depth: 0 };

    const midpoint = Math.ceil(pool.length / 2);
    const left = buildPool(pool.slice(0, midpoint), poolNumber);
    const right = buildPool(pool.slice(midpoint), poolNumber);
    const depth = Math.max(left.depth, right.depth) + 1;
    const key = `Q-${poolNumber + 1}-${depth}-${order}`;
    matches.push({
      key,
      stage: "qualification",
      round: depth,
      order: order++,
      bestOf: 1,
      group: `Кваліфікаційна група ${poolNumber + 1}`,
      participantOne: left.source,
      participantTwo: right.source
    });
    return { source: { type: "winner", matchKey: key, label: `Переможець ${key}` }, depth };
  }

  pools.forEach((pool, poolNumber) => buildPool(pool, poolNumber));

  const byKey = new Map(matches.map((match) => [match.key, match]));
  for (const match of matches) {
    for (const [slot, source] of [[1, match.participantOne], [2, match.participantTwo]] as const) {
      if (source.type === "winner") byKey.get(source.matchKey)!.winnerTo = { matchKey: match.key, slot };
    }
  }

  return matches.sort((a, b) => a.round - b.round || a.order - b.order);
}

export function createGroups(qualifiedTeams: TournamentSeed[]): GroupAssignment[] {
  if (qualifiedTeams.length !== 16) throw new Error("Груповий етап потребує рівно 16 команд");
  const sorted = [...qualifiedTeams].sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
  const groups: GroupAssignment[] = groupNames.map((name) => ({ name, members: [], matches: [] }));
  const snake = [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 0];

  sorted.forEach((team, index) => groups[snake[index]].members.push(team));
  const roundPairs = [
    [[0, 3], [1, 2]],
    [[0, 2], [3, 1]],
    [[0, 1], [2, 3]]
  ] as const;

  for (const group of groups) {
    let order = 1;
    roundPairs.forEach((pairs, roundIndex) => {
      pairs.forEach(([one, two]) => {
        group.matches.push({
          key: `G-${group.name}-${roundIndex + 1}-${order}`,
          stage: "groups",
          round: roundIndex + 1,
          order: order++,
          bestOf: 1,
          group: group.name,
          participantOne: registrationSource(group.members[one]),
          participantTwo: registrationSource(group.members[two])
        });
      });
    });
  }

  return groups;
}

export function calculateStandings(members: TournamentSeed[], results: GroupResult[]): Standing[] {
  const standings = new Map<string, Standing>(
    members.map((team) => [team.id, { ...team, played: 0, wins: 0, losses: 0, mapsWon: 0, mapsLost: 0, points: 0 }])
  );

  for (const result of results) {
    const team = standings.get(result.registrationId);
    if (!team) continue;
    team.played += 1;
    team.mapsWon += result.score;
    team.mapsLost += result.opponentScore;
    if (result.score > result.opponentScore) {
      team.wins += 1;
      team.points += 3;
    } else if (result.score < result.opponentScore) {
      team.losses += 1;
    } else {
      team.points += 1;
    }
  }

  return [...standings.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.mapsWon - b.mapsLost - (a.mapsWon - a.mapsLost) ||
      b.mapsWon - a.mapsWon ||
      a.seed - b.seed
  );
}

export function createPlayoff(groupStandings: Record<string, Standing[]>): PlannedMatch[] {
  for (const name of groupNames) {
    if (!groupStandings[name] || groupStandings[name].length < 2) {
      throw new Error(`У групі ${name} ще немає двох фіналістів`);
    }
  }

  const source = (group: string, index: number) => registrationSource(groupStandings[group][index]);
  const matches: PlannedMatch[] = [
    { key: "PO-QF1", stage: "playoff", round: 1, order: 1, bestOf: 3, participantOne: source("A", 0), participantTwo: source("B", 1), winnerTo: { matchKey: "PO-SF1", slot: 1 }, loserTo: { matchKey: "PL-SF1", slot: 1 } },
    { key: "PO-QF2", stage: "playoff", round: 1, order: 2, bestOf: 3, participantOne: source("C", 0), participantTwo: source("D", 1), winnerTo: { matchKey: "PO-SF1", slot: 2 }, loserTo: { matchKey: "PL-SF1", slot: 2 } },
    { key: "PO-QF3", stage: "playoff", round: 1, order: 3, bestOf: 3, participantOne: source("B", 0), participantTwo: source("A", 1), winnerTo: { matchKey: "PO-SF2", slot: 1 }, loserTo: { matchKey: "PL-SF2", slot: 1 } },
    { key: "PO-QF4", stage: "playoff", round: 1, order: 4, bestOf: 3, participantOne: source("D", 0), participantTwo: source("C", 1), winnerTo: { matchKey: "PO-SF2", slot: 2 }, loserTo: { matchKey: "PL-SF2", slot: 2 } },
    { key: "PO-SF1", stage: "playoff", round: 2, order: 5, bestOf: 3, participantOne: { type: "winner", matchKey: "PO-QF1", label: "Переможець QF1" }, participantTwo: { type: "winner", matchKey: "PO-QF2", label: "Переможець QF2" }, winnerTo: { matchKey: "PO-FINAL", slot: 1 }, loserTo: { matchKey: "PO-BRONZE", slot: 1 } },
    { key: "PO-SF2", stage: "playoff", round: 2, order: 6, bestOf: 3, participantOne: { type: "winner", matchKey: "PO-QF3", label: "Переможець QF3" }, participantTwo: { type: "winner", matchKey: "PO-QF4", label: "Переможець QF4" }, winnerTo: { matchKey: "PO-FINAL", slot: 2 }, loserTo: { matchKey: "PO-BRONZE", slot: 2 } },
    { key: "PL-SF1", stage: "placement", round: 2, order: 7, bestOf: 3, participantOne: { type: "loser", matchKey: "PO-QF1", label: "Команда з QF1" }, participantTwo: { type: "loser", matchKey: "PO-QF2", label: "Команда з QF2" }, winnerTo: { matchKey: "PO-FIFTH", slot: 1 } },
    { key: "PL-SF2", stage: "placement", round: 2, order: 8, bestOf: 3, participantOne: { type: "loser", matchKey: "PO-QF3", label: "Команда з QF3" }, participantTwo: { type: "loser", matchKey: "PO-QF4", label: "Команда з QF4" }, winnerTo: { matchKey: "PO-FIFTH", slot: 2 } },
    { key: "PO-FINAL", stage: "playoff", round: 3, order: 9, bestOf: 5, participantOne: { type: "winner", matchKey: "PO-SF1", label: "Фіналіст 1" }, participantTwo: { type: "winner", matchKey: "PO-SF2", label: "Фіналіст 2" } },
    { key: "PO-BRONZE", stage: "placement", round: 3, order: 10, bestOf: 5, participantOne: { type: "loser", matchKey: "PO-SF1", label: "Учасник матчу за 3 місце" }, participantTwo: { type: "loser", matchKey: "PO-SF2", label: "Учасник матчу за 3 місце" } },
    { key: "PO-FIFTH", stage: "placement", round: 3, order: 11, bestOf: 5, participantOne: { type: "winner", matchKey: "PL-SF1", label: "Учасник матчу за 5 місце" }, participantTwo: { type: "winner", matchKey: "PL-SF2", label: "Учасник матчу за 5 місце" } }
  ];
  return matches;
}

export function placeMatch(matchKey: string, winnerId: string, loserId: string) {
  if (matchKey === "PO-FINAL") return [{ place: 1, registrationId: winnerId }, { place: 2, registrationId: loserId }];
  if (matchKey === "PO-BRONZE") return [{ place: 3, registrationId: winnerId }, { place: 4, registrationId: loserId }];
  if (matchKey === "PO-FIFTH") return [{ place: 5, registrationId: winnerId }, { place: 6, registrationId: loserId }];
  return [];
}
