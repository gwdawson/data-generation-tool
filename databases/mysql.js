import fs from "fs";
import ini from "ini";
import process from "process";
import mysql from "mysql2/promise";
import { faker } from "@faker-js/faker";
import { exit, getSineWaveDataPoints } from "../utilities/utils.js";

const settings = ini.parse(fs.readFileSync("./configuration/settings.ini", "utf-8"));
const defaultDatabase = "mysql";

switch (process.argv[2]) {
  case "generate":
    generateDatabase();
    break;
  case "populate":
    insertData();
    break;
  case "destruct":
    destructDatabase();
    break;
  default:
    process.exit(0);
}

async function generateDatabase() {
  const connectionDB = await mysql.createConnection({
    host: settings.mysql.connection.host,
    port: settings.mysql.connection.port,
    database: defaultDatabase,
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  await connectionDB.execute(`
    CREATE DATABASE ${settings.mysql.data.databaseName};
  `);

  const connection = await mysql.createConnection({
    host: settings.mysql.connection.host,
    port: settings.mysql.connection.port,
    database: settings.mysql.data.databaseName,
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  await connection.execute(`
    CREATE TABLE ${settings.mysql.data.staticTableName} (
      uuid VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      birthdate DATETIME NOT NULL,
      registered DATETIME NOT NULL
    );
  `);

  await connection.execute(`
    CREATE TABLE ${settings.mysql.data.timeSeriesTableName} (
      time DATETIME NOT NULL,
      value FLOAT NOT NULL
    );
  `);

  exit("Successfully generated mysql database.");
}

async function insertData() {
  const connection = await mysql.createConnection({
    host: settings.mysql.connection.host,
    port: settings.mysql.connection.port,
    database: settings.mysql.data.databaseName,
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  console.log("Inserting data into the mysql database.");

  setInterval(async () => {
    const { xValue, yValue } = getSineWaveDataPoints();

    await connection.execute(`
      INSERT INTO ${settings.mysql.data.timeSeriesTableName} (time, value)
      VALUES (STR_TO_DATE('${xValue}', '%Y-%m-%dT%H:%i:%s.%fZ'), '${yValue}');
    `);

    await connection.execute(`
      INSERT INTO ${settings.mysql.data.staticTableName} (uuid, username, email, password, birthdate, registered)
      VALUES ('${faker.string.uuid()}', '${faker.internet.userName()}', '${faker.internet.exampleEmail()}', '${faker.internet.password()}', STR_TO_DATE('${faker.date.birthdate().toISOString()}', '%Y-%m-%dT%H:%i:%s.%fZ'), STR_TO_DATE('${faker.date.recent().toISOString()}', '%Y-%m-%dT%H:%i:%s.%fZ'));
    `);
  }, settings.mysql.data.timeout);
}

async function destructDatabase() {
  const connection = await mysql.createConnection({
    host: settings.mysql.connection.host,
    port: settings.mysql.connection.port,
    database: defaultDatabase,
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  await connection.execute(`
    DROP DATABASE ${settings.mysql.data.databaseName};
  `);

  exit("Successfully dropped the mysql database.");
}
