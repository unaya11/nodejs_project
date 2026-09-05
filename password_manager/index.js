import bcrypt from "bcrypt";
import promptModule from "prompt-sync";
import { MongoClient } from "mongodb";

const dbUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
const client = new MongoClient(dbUrl);
let hasPasswords = false;
let passwordsCollection, authCollection;
const dbName = "passwordManager";

const main = async () => {
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    authCollection = db.collection("auth");
    passwordsCollection = db.collection("passwords");
    const hashedPassword = await authCollection.findOne({ type: "auth" });
    hasPasswords = !!hashedPassword;
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

const prompt = promptModule();
// const mockDB = { passwords: {} };

const saveNewPassword = async (password, saltRounds) => {
  const hash = bcrypt.hashSync(password, saltRounds);
  await authCollection.insertOne({ type: "auth", hash, saltRounds });
  console.log("Main password has been set!");
  showMenu();
};

const compareHashedPassword = async (password) => {
  const { hash } = await authCollection.findOne({ type: "auth" });
  return await bcrypt.compare(password, hash);
};

const promptNewPassword = async () => {
  const response = prompt("Enter your new password: ");
  const saltRounds = parseInt(prompt("Enter saltRounds: "));
  await saveNewPassword(response, saltRounds);
};

const promptOldPassword = async () => {
  let verified = false;
  while (!verified) {
    const response = prompt("Enter your password: ");
    const result = await compareHashedPassword(response);
    if (result) {
      console.log("Password verified");
      verified = true;
      showMenu();
    } else {
      console.log("Password incorrect. Try again. ");
    }
  }
};
const showMenu = async () => {
  console.log(`
        1. View passwords
        2. Manage new password
        3. Verify password
        4. Exit
        5. Find password by source`);
  const response = prompt(">");

  switch (response) {
    case "1":
      await viewPasswords();
      break;
    case "2":
      await promptManagenewPassword();
      break;
    case "3":
      await promptOldPassword();
      break;
    case "4":
      process.exit();
    case "5":
      await findpassword();
      break;
    default:
      console.log(`That's an invalid response.`);
      await showMenu();
  }
};

const viewPasswords = async () => {
  const passwords = await passwordsCollection.find({}).toArray();
  passwords.forEach(({ source, password }, index) => {
    console.log(`${index + 1}. ${source} => ${password}`);
  });
  await showMenu();
};

const promptManagenewPassword = async () => {
  const source = prompt("Enter name for password: ");
  const password = prompt("Enter password to save: ");
  await passwordsCollection.findOneAndUpdate(
    { source },
    { $set: { password } },
    {
      returnDocument: "after",
      upsert: true,
    },
  );
  console.log(`Password for ${source} has been saved!`);
  showMenu();
};

const findpassword = async () => {
  const source = prompt("Enter source: ");

  const passwords = await passwordsCollection.find({ source }).toArray();
  if (passwords.length !== 0) {
    passwords.forEach(({ source, password }, index) => {
      console.log(`${index + 1}. ${source} => ${password}`);
    });
  } else {
    console.log("No password saved for that source.");
  }

  await showMenu();
};
// if (!mockDB.hash) promptNewPassword();
// else promptOldPassword();

await main();
if (!hasPasswords) await promptNewPassword();
else await promptOldPassword();
