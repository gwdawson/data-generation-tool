import fs from "fs";
import ini from "ini";
import process from "process";
import postgres from "postgres";
import { faker } from "@faker-js/faker";
import { exit, getSineWaveDataPoints } from "../utilities/utils.js";

const settings = ini.parse(fs.readFileSync("./configuration/settings.ini", "utf-8"));
const defaultDatabase = "postgres";

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
  const sqlDB = postgres({
    host: settings.postgres.connection.host,
    port: settings.postgres.connection.port,
    database: defaultDatabase,
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  await sqlDB`
    CREATE DATABASE ${sqlDB(settings.postgres.data.databaseName)};
  `;

  const sql = postgres({
    host: settings.postgres.connection.host,
    port: settings.postgres.connection.port,
    database: settings.postgres.data.databaseName,
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  await sql`
    CREATE TABLE ${sql(settings.postgres.data.staticTableName)} (
      uuid VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      birthdate TIMESTAMP NOT NULL,
      registered TIMESTAMP NOT NULL
    );
  `;

  await sql`
    CREATE TABLE ${sql(settings.postgres.data.timeSeriesTableName)} (
      time TIMESTAMP NOT NULL,
      value FLOAT NOT NULL
    );
  `;

  exit("Successfully generated postgres database.");
}

async function insertData() {
  const sql = postgres({
    host: settings.postgres.connection.host,
    port: settings.postgres.connection.port,
    database: settings.postgres.data.databaseName,
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  console.log("Inserting data into the postgres database.");

  setInterval(async () => {
    const { xValue, yValue } = getSineWaveDataPoints();

    await sql`
      INSERT INTO ${sql(settings.postgres.data.timeSeriesTableName)} (time, value)
      VALUES (${xValue}, ${yValue});
    `;

    await sql`
      INSERT INTO ${sql(settings.postgres.data.staticTableName)} (uuid, username, email, password, birthdate, registered)
      VALUES (${faker.string.uuid()}, ${faker.internet.userName()}, ${faker.internet.exampleEmail()}, ${faker.internet.password()}, ${faker.date.birthdate()}, ${faker.date.recent()});
    `;
  }, settings.postgres.data.timeout);
}

async function destructDatabase() {
  const sql = postgres({
    host: settings.postgres.connection.host,
    port: settings.postgres.connection.port,
    database: defaultDatabase,
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  await sql`
    DROP DATABASE ${sql(settings.postgres.data.databaseName)};
  `;

  exit("Successfully dropped the postgres database.");
}
