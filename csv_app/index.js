import fs from "node:fs";
import { createObjectCsvWriter } from "csv-writer";
import prompt from "prompt";

prompt.start();
prompt.message = "";

const path = "./contacts.csv";
const fileExistsAndNotEmpty = fs.existsSync(path) && fs.statSync(path).size > 0;
const csvWriter = createObjectCsvWriter({
  path,
  append: fileExistsAndNotEmpty,
  header: [
    { id: "name", title: "NAME" },
    { id: "number", title: "NUMBER" },
    { id: "email", title: "EMAIL" },
    { id: "createdAt", title: "DATA" },
  ],
});

class Person {
  constructor(name = "", number = "", email = "") {
    this.name = name;
    this.number = number;
    this.email = email;
    // createdAtはsaveToCSV()でなくコンストラクタで設定する方が良さげ
  }

  async saveToCSV() {
    try {
      const { name, number, email } = this;
      const createdAt = new Date().toISOString();
      await csvWriter.writeRecords([{ name, number, email, createdAt }]);
      console.log(`${name} Saved!`);
    } catch (err) {
      console.error(err);
    }
  }
}

const startApp = async () => {
  const questions = [
    { name: "name", description: "Contact Name" },
    { name: "number", description: "Contact Number" },
    { name: "email", description: "Contact Email" },
  ];

  const responses = await prompt.get(questions);

  const numberPatern = /^[0-9]+$/;
  const emailPatern = /\S+@\S+\.\S+/;
  if (!numberPatern.test(responses.number)) {
    console.log("Numberは数字のみ入力してください");
    startApp();
    return;
  }
  if (!emailPatern.test(responses.email)) {
    console.log("Emailは正しい形式で入力してください");
    startApp();
    return;
  }

  const person = new Person(responses.name, responses.number, responses.email);
  await person.saveToCSV();

  const { again } = await prompt.get([
    { name: "again", description: "Continue? [y to continue]" },
  ]);

  if (again.toLowerCase() === "y") await startApp();
};
startApp();
