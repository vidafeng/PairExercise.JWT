const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");

const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  try {
    // returns data (actual user)
    const verify = jwt.verify(token, process.env.jwt);

    const user = await User.findByPk(verify.userId);

    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  // this is supposed to return jwt

  try {
    const user = await User.findOne({
      where: {
        username,
        password,
      },
    });
    const token = jwt.sign({ userId: user.id }, process.env.jwt);
    return token;
  } catch (error) {
    error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
