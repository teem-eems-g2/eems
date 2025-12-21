

module.exports = {
  development: {
    dialect: "postgres",
    host: "localhost",
    port: 5432,
    database: "eems_db",
    username: "postgres",
    password: "password"
  },
  test: {
    dialect: "sqlite",
    storage: ":memory:"
  }
};


