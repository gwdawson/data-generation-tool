import fs from "fs";
import ini from "ini";
import process from "process";
import postgres from "postgres";
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
  const sqlDefault = postgres({
    host: settings.postgres.connection.host,
    port: settings.postgres.connection.port,
    database: "postgres",
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  try {
    await sqlDefault`
      CREATE DATABASE ${sqlDefault(settings.postgres.data.databaseName)};
    `;
  } catch (e) {
    sqlDefault.end();
    console.error(e);
    process.exit(1);
  }

  sqlDefault.end();

  const sql = postgres({
    host: settings.postgres.connection.host,
    port: settings.postgres.connection.port,
    database: settings.postgres.data.databaseName,
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  try {
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
  } catch (e) {
    sql.end();
    console.error(e);
    process.exit(1);
  }

  try {
    await sql`
      CREATE TABLE ${sql(settings.postgres.data.timeSeriesTableName)} (
        time TIMESTAMP NOT NULL,
        value FLOAT NOT NULL
      );
    `;
  } catch (e) {
    sql.end();
    console.error(e);
    process.exit(1);
  }

  sql.end();
  console.log("Successfully generated postgres database.");
  process.exit(0);
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
    const xValue = new Date().toISOString();
    const currentTime = new Date().getTime();
    const amplitude = 50;
    const frequency = 0.1;
    const y = amplitude * Math.sin((frequency * currentTime) / 1000);
    const yValue = ((y + amplitude) / (2 * amplitude)) * 100;

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
    database: "postgres",
    username: settings.postgres.connection.username,
    password: settings.postgres.connection.password,
  });

  try {
    await sql`
      DROP DATABASE ${sql(settings.postgres.data.databaseName)};
    `;
  } catch (e) {
    sql.end();
    console.error(e);
    process.exit(1);
  }

  sql.end();
  console.log("Successfully dropped the postgres database.");
  process.exit(0);
}
