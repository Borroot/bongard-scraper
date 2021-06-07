const cheerio = require("cheerio");
const got = require("got");
const fs = require("fs-extra");

const url = "https://www.foundalis.com/res/bps";

async function retrieve_puzzle(postfix) {
  try {
    const response = await got(`${url}/${postfix}`);
    fs.outputFile(`puzzles/${postfix}`, await response.rawBody);
  } catch (error) {
    // if .gif does not work, try .png
    try {
      const response = await got(`${url}/${postfix.replace(/\.\w*$/, ".png")}`);
      fs.outputFile(`puzzles/${postfix}`, await response.rawBody);
    } catch (error) {
      const puzzle_name = postfix.replace(/\.\w*$/, "");
      console.error(
        `[Error] postfix: ${puzzle_name},`,
        error?.response.statusCode,
        error?.response.statusMessage
      );
      fs.appendFile("puzzles/missing.txt", puzzle_name + "\n");
    }
  }
}

async function retrieve_tables() {
  try {
    const response = await got(`${url}/bpidx.htm`);
    return response.body;
  } catch (error) {
    console.error(
      "[Error] processing table",
      error?.response.statusCode,
      error?.response.statusMessage
    );
    process.exit(1);
  }
}

function parse_table(table) {
  let hrefs = [];
  for (let node of table) hrefs.push(node.attribs.href);
  return hrefs;
}

async function process_tables() {
  const body = await retrieve_tables();
  const $ = cheerio.load(body);

  const tables = [4, 5].map((n) => $(`#table${n} > tbody > tr > td > a`));
  const postfixes = tables.map(parse_table).flat(1);

  postfixes.push(
    $("#table5 > tbody > tr:nth-child(3) > td:nth-child(20) > span > a")[0]
      .attribs.href
  ); // some weird exception

  return postfixes.map((postfix) => postfix.replace(/htm$/, "gif"));
}

async function process_puzzles() {
  const postfixes = await process_tables();
  postfixes.forEach(retrieve_puzzle);
}

process_puzzles();
