const { request, gql } = require('graphql-request');
const fs = require('fs/promises');
const codes = require('./codes.json');
const query = gql`
query UserProfilePageQuery($cc: String, $uid: String) {
  getUser(fbUid: $uid, connectCode: $cc) {
    displayName
    connectCode {
      code
    }
    rankedNetplayProfile {
      id
      ratingOrdinal
      ratingUpdateCount
      wins
      losses
      dailyGlobalPlacement
      dailyRegionalPlacement
      continent
      characters {
        character
        gameCount
      }
    }
  }
}
`;

const timeout = async ms => new Promise((resolve) => setTimeout(resolve, ms));
const endpoint = 'https://internal.slippi.gg/graphql';
const getPlayerData = async (rawCC) => {
  if (!rawCC.includes("#")) {
    return { getConnectCode: null }
  }
  const cc = rawCC.toUpperCase();
  const variables = { cc };
  let rtCount = 0;
  while (true) {
    try {
      const data = await request(endpoint, query, variables);
      const user = data.getUser;
      const getConnectCode = user && { user };
      return { getConnectCode };
    }
    catch (e) {
      console.log(e);
      rtCount += 1;
      console.log("Retrying", { cc, rtCount });
      await timeout(5000);
    }
  }
}
const getUnixTimestamp = () => Math.floor(Date.now() / 1000);
const main = async () => {
  const data = {};
  for (const [code, tag] of codes) {
    const playerData = await getPlayerData(code);
    console.log(code);
    await timeout(5000);
    data[code.toUpperCase()] = { ...playerData, tag };
  }
  const updatedAt = getUnixTimestamp();
  const json = { data, updatedAt };
  await fs.writeFile('./data.json', JSON.stringify(json));
};
main()
