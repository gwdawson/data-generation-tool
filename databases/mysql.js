import fs from "fs";
import ini from "ini";
import process from "process";
import mysql from "mysql2/promise";
import { faker } from "@faker-js/faker";

const settings = ini.parse(fs.readFileSync("./configuration/settings.ini", "utf-8"));

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
  const connectionDefault = await mysql.createConnection({
    host: settings.mysql.connection.host,
    port: settings.mysql.connection.port,
    database: "mysql",
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  try {
    await connectionDefault.execute(`
      CREATE DATABASE ${settings.mysql.data.databaseName};
    `);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: settings.mysql.connection.host,
    port: settings.mysql.connection.port,
    database: settings.mysql.data.databaseName,
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  try {
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
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  try {
    await connection.execute(`
      CREATE TABLE ${settings.mysql.data.timeSeriesTableName} (
        time DATETIME NOT NULL,
        value FLOAT NOT NULL
      );
    `);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log("Successfully generated mysql database.");
  process.exit(0);
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
    const xValue = new Date().toISOString();
    const currentTime = new Date().getTime();
    const amplitude = 50;
    const frequency = 0.1;
    const y = amplitude * Math.sin((frequency * currentTime) / 1000);
    const yValue = ((y + amplitude) / (2 * amplitude)) * 100;

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
    database: "mysql",
    user: settings.mysql.connection.username,
    password: settings.mysql.connection.password,
  });

  try {
    await connection.execute(`
      DROP DATABASE ${settings.mysql.data.databaseName};
    `);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log("Successfully dropped the mysql database.");
  process.exit(0);
}
