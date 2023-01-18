// const curl = require('request-curl');
const fs = require('fs/promises');
const csv = require('csvtojson');

const csvUrl = (
  "https://docs.google.com/spreadsheets/d" + 
  "/1R9H28_XBZjP7BhdHVMNwi5xdFkFSo2XwkOe2X05tifo" +
  "/export?format=csv"
);

let nodeFetch;
const fetch = async (url) => {
  const res = await nodeFetch(url);
  if (res.status === 307) {
    return await fetch(res.headers.Location)
  }
  const body = await res.text();
  const raw = await csv({ noheader: true }).fromString(body);
  return raw.slice(1);
};

const main = async (nf) => {
  nodeFetch = nf;
  const data = await fetch(csvUrl);
  const codes = {};
  data.forEach((row) => {
    const cc = row.field2.toLowerCase();
    const tag = row.field3;
    const isAdding = row.field4 === 'Added To';
    if (isAdding) {
      codes[cc] = tag;
    } else {
      delete codes[cc];
    }
  });
  const ccs = Object.keys(codes);
  ccs.sort();
  const next = ccs.map(cc => [cc, codes[cc]]);
  await fs.writeFile('./codes.json', JSON.stringify(next));
}

import('node-fetch').then(({default: nodeFetch}) => main(nodeFetch));
