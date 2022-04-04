const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

const Note = conn.define("note", {
  text: STRING,
});

// Associations
User.hasMany(Note);
Note.belongsTo(User);

User.byToken = async (token) => {
  try {
    // returns data (actual user)
    console.log("token", token);
    const verify = await jwt.verify(token, process.env.JWT);

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
  try {
    const user = await User.findOne({
      where: {
        username,
      },
    });
    const result = await bcrypt.compare(password, user.password);
    // if hashed pw is the same as plain text pw
    if (result) {
      // return the token and allow sign in
      return await jwt.sign({ userId: user.id }, process.env.JWT);
    }
  } catch (error) {
    error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.beforeCreate(async (user) => {
  const saltRounds = 10;
  // third argument not necessary, why?
  const hash = await bcrypt.hash(user.password, saltRounds);
  user.password = hash;

  //   console.log(user.password);

  //   await bcrypt.genSalt(saltRounds, function (err, salt) {
  //     bcrypt.hash(user.password, salt, function (err, hash) {
  //       user.password = hash;
  //     });
  //     console.log(user.password);
  //   });
});

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

  const notes = [
    { text: "I should walk my dog" },
    { text: "This pair exercise is quite hard" },
    { text: "Cookies sound great right now" },
  ];

  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );

  await lucy.setNotes(note1);
  await moe.setNotes([note2, note3]);

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
    Note,
  },
};
