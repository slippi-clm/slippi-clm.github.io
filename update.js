const { request, gql } = require('graphql-request');
const fs = require('fs/promises');
const codes = require('./codes.json');
const query = gql`
query AccountManagementPageQuery($cc: String!) {
  getConnectCode(code: $cc) {
    user {
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
          id
          character
          gameCount
        }
      }
    }
  }
}
`;
const endpoint = 'https://gql-gateway-dot-slippi.uc.r.appspot.com/graphql';
const getPlayerData = async (cc) => {
  const variables = { cc: cc.toUpperCase() };
  const data = await request(endpoint, query, variables);
  return data;
}
const timeout = async ms => new Promise((resolve) => setTimeout(resolve, ms));
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