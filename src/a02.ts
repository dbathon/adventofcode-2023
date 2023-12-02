import { p, readLines, sum } from "./util/util";

const lines = readLines("input/a02.txt");

type Subset = Record<string, number>;

class Game {
  constructor(readonly id: number, readonly subsets: Subset[]) {}
}

const games: Game[] = lines.map((line) => {
  const [game, rest] = line.split(":");
  const id = parseInt(game.split(" ")[1]);
  const subsets: Subset[] = rest.split(";").map((s) =>
    Object.fromEntries(
      s
        .trim()
        .split(",")
        .map((p) => {
          const [count, color] = p.trim().split(" ");
          return [color, parseInt(count)];
        })
    )
  );
  return new Game(id, subsets);
});

p(
  sum(
    games
      .filter((game) =>
        game.subsets.every((subset) => (subset.red ?? 0) <= 12 && (subset.green ?? 0) <= 13 && (subset.blue ?? 0) <= 14)
      )
      .map((game) => game.id)
  )
);

p(
  sum(
    games.map((game) => {
      const minSubset: Subset = {};
      game.subsets.forEach((subset) => {
        Object.entries(subset).forEach(([color, count]) => {
          minSubset[color] = Math.max(minSubset[color] ?? 0, count);
        });
      });
      return (minSubset.red ?? 0) * (minSubset.green ?? 0) * (minSubset.blue ?? 0);
    })
  )
);
