import * as $ from "@dz/-";
import { fs } from "@dz/-/node";
import git from "git-client";

async function getInitialDB() {
  try {
    const content = await fs.readFile("db.json", "utf8");
    return JSON.parse(content);
  } catch (_e) {
    return { players: {}, seasons: {}, commits: [] };
  }
}

async function main() {
  const logs = await git.log({ "pretty=format:%H": true });
  const commitHashes = logs
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  commitHashes.reverse();

  let currSeason = 1;
  const DB = await getInitialDB();

  function processData({ data, updatedAt: timestamp }, nth) {
    let anyReset = false;
    function getUser(playerData) {
      if (!playerData) {
        return null;
      }

      if (!playerData.getConnectCode) {
        return null;
      }

      if (playerData.getConnectCode.user === null) {
        return null;
      }

      return playerData.getConnectCode.user || playerData.getConnectCode;
    }

    function player(cc) {
      const playerData = data[cc];
      const user = getUser(playerData);
      if (!user) {
        return;
      }
      function asSetsData({ wins, losses, characters }) {
        const characterUsage = {};
        for (const c of characters) {
          const char = $.SSBM.Char.ofSlippiApiName(c.character);
          characterUsage[char.id] = c.gameCount;
        }
        return { wins: wins || 0, losses: losses || 0, characterUsage };
      }
      const curr = {
        tag: playerData.tag,
        displayName: user.displayName,
        setsData: asSetsData(user.rankedNetplayProfile),
        rating: user.rankedNetplayProfile.ratingOrdinal,
        globalPlacement: user.rankedNetplayProfile.dailyGlobalPlacement,
        regionalPlacement: user.rankedNetplayProfile.dailyRegionalPlacement,
        continent: user.rankedNetplayProfile.continent,
      };

      function playerInterface(dbPlayer) {
        function getLatest(o, k) {
          const els = o[k];
          return $._map(els[els.length - 1], $.$("val"));
        }

        const p = {
          ...dbPlayer,
          get currSeason() {
            return dbPlayer.currSeason;
          },
          get tag() {
            return getLatest(p, "tags");
          },
          get displayName() {
            return getLatest(p, "displayNames");
          },
          get setsData() {
            return getLatest(p, "setsDatas");
          },
          get rating() {
            return getLatest(p, "ratings");
          },
          get globalPlacement() {
            return getLatest(p, "globalPlacements");
          },
          get regionalPlacement() {
            return getLatest(p, "regionalPlacements");
          },
          get continent() {
            return getLatest(p, "continents");
          },
          isSameSeason(nextSetsData) {
            const currSetsData = p.setsData || { wins: 0, losses: 0 };
            const nextTotal = nextSetsData.wins + nextSetsData.losses;
            const currTotal = currSetsData.wins + currSetsData.losses;
            return nextTotal + 60 >= currTotal;
          },
        };
        return p;
      }

      DB.players[cc] ||= {
        addedAt: timestamp,
        tags: [],
        displayNames: [],
        setsDatas: [],
        ratings: [],
        globalPlacements: [],
        regionalPlacements: [],
        continents: [],
        characters: {},
        allCharacters: [],
      };
      DB.players[cc].updatedAt = timestamp;
      const p = playerInterface(DB.players[cc]);
      const wasAnyReset = anyReset;
      anyReset ||= currSeason == p.currSeason && !p.isSameSeason(curr.setsData);
      DB.players[cc].currSeason = currSeason;

      function addIfChanged(k, isUnchanged = () => {}) {
        const pk = p[k];
        const ck = curr[k];
        if (pk === ck || isUnchanged(pk, ck)) {
          return;
        }
        p[`${k}s`].push({ val: ck, timestamp });
      }

      const rankedProfileKeyer =
        (keys = []) =>
        (p) => {
          if (!p) {
            return "";
          }
          return keys.map((k) => $.$(k)(p)).join("|");
        };

      function mkIsUnchanged(...keys) {
        const keyer = rankedProfileKeyer(keys);
        return (v1, v2) => keyer(v1) === keyer(v2);
      }

      addIfChanged("tag");
      addIfChanged("displayName");
      addIfChanged("setsData", mkIsUnchanged("wins", "losses"));
      addIfChanged("rating");
      addIfChanged("globalPlacement");
      addIfChanged("regionalPlacement");
      addIfChanged("continent");

      return p;
    }

    console.error(new Date(timestamp * 1000));
    for (const cc in data) {
      player(cc);
      // p && console.error(JSON.parse(JSON.stringify(p)));
      // p && cc === "SHAB#187" && console.error({ cc, ...asPojo(p) });
      // console.error(data[cc]);
    }
    if (anyReset) {
      DB.seasons[currSeason] = nth;
      currSeason++;
      console.error("\nRESETTING!!!!!!", { timestamp, currSeason }, "\n");
    }
  }

  async function processCommit(hash, nth) {
    if (DB.commits[nth]) {
      if (DB.commits[nth].hash !== hash) {
        throw `BAD HASHES  | ${hash} | ${nth} | ${DB.commits[nth].hash}`;
      }
      return;
    }
    let data;
    try {
      const content = await git.catFile({ p: `${hash}:data.json` });
      data = JSON.parse(content);
    } catch (_e) {}
    data && processData(data, nth);
    DB.commits[nth] = { hash, nth };
    return;
  }

  for (const [hash, nth] of $.withInd(commitHashes)) {
    console.error(currSeason /*, hash*/, "", nth, "/", commitHashes.length);
    if (nth > -1) {
      // if (nth > 6945 && nth < 9000) {
      await processCommit(hash, nth);
      // console.error(DB.players["PINK#715"].setsDatas.map(({ val }) => val));
    }
  }

  console.error("saving");
  await fs.writeFile("db.json", JSON.stringify(DB));
  console.error(commitHashes);
  /*
  const f = await git.catFile({
    p: "8d188bd39bbf717bb7150fc6f28d30e98044ed84:data.json",
  });
  console.error(f);
  */
}

$.execAndExit(main());
