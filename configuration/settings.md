```ini
[postgres]

[postgres.connection]
host     # The host location of the postgres database
port     # The port number of the postgres database
username # The username to connect to the postgres database
password # The password to connect to the postgres database

[postgres.data]
databaseName        # The name of the database to be created
staticTableName     # The name of the table that will be used for static data
timeSeriesTableName # The name of the table that will be used for time series data
timeout             # The time between each generated data point in milliseconds
```
