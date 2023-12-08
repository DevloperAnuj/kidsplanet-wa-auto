import { createRequire } from "module";
const require = createRequire(import.meta.url);

require("dotenv").config();
// const fs = require("fs");
// const path = require("path");
const axios = require("axios");
const express = require("express");
const app = express();
const morgan = require("morgan");
// const createCsvWriter = require("csv-writer").createObjectCsvWriter;

import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://acmbsmfndayyqsbcaegs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbWJzbWZuZGF5eXFzYmNhZWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE0MjE4MjksImV4cCI6MjAxNjk5NzgyOX0.dAvj7X4bOPLLJOprsyi4ZjSrbOMISt6WwvPIHDTkbms"
);

const port = process.env.PORT;

// const csvWriter = createCsvWriter({
//   path: __dirname + "/file.csv",
//   header: [
//     { id: "name", title: "NAME" },
//     { id: "number", title: "NUMBER" },
//     { id: "date", title: "DATELOG" },
//   ],
// });

// let assessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
//   flags: "a",
// });

app.use(morgan("dev"));
// app.use(morgan("combined", { stream: assessLogStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  console.log("Its Get Request");
  res.status(200).json({
    success: true,
  });
});

app.get("/webhook", (req, res, next) => {
  console.log("==============");
  console.log(req.body);
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.WEBHOOK
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
  next();
});

// app.post("/webhook", (req, res) => {
//   let body_param = req.body;
//   console.log(JSON.stringify(body_param, null, 2));
// });

// app.get("/log", (req, res) => {
//   filePath = path.join(__dirname, "access.log");
//   fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
//     if (!err) {
//       console.log("received data: " + data);
//       res.writeHead(200, { "Content-Type": "text/plain" });
//       res.write(data);
//       res.end();
//     } else {
//       console.log(err);
//     }
//   });
// });

// app.get("/user", (req, res) => {
//   filePath = path.join(__dirname, "file.csv");
//   fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
//     if (!err) {
//       console.log("received data: " + data);
//       res.writeHead(200, { "Content-Type": "text/plain" });
//       res.write(data);
//       res.end();
//     } else {
//       console.log(err);
//     }
//   });
// });

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  console.log(date);
  return date;
}

//Get My User from Number
app.get("/isuser/:number", async (req, res) => {
  console.log("Its Check User Request");
  var subendDate = null;
  if (req.params.number === "df748f4") {
    subendDate = addDays(30);
  } else if (req.params.number === "bbd2f7b") {
    subendDate = addDays(180);
  } else {
    subendDate = addDays(365);
  }
  const { data, error } = await supabase
    .from("users")
    .select("name, phone,email")
    .eq("phone", req.params.number)
    .single();
  if (data === null) {
    console.log("Data is Null");
    const { error } = await supabase.from("users").insert({
      name: "Denmark",
      phone: req.params.number,
      email: "req@email.com",
      addr: "req Address Here",
      subend: subendDate,
    });
  } else {
    console.log("Data is Available");
    const { error } = await supabase
      .from("users")
      .update({ subend: subendDate })
      .eq("phone", req.params.number);
  }
});

//Getting Whatsapp Message After Subcribe Free NewsLetter
app.post("/submit", async (req, res, next) => {
  console.log(req.body);
  console.log("Its Check User Request");
  var subendDate = null;
  var subName = null;
  if (req.body["form_id"] === "df748f4") {
    subendDate = addDays(30);
    subName = "3 Months";
  } else if (req.body["form_id"] === "bbd2f7b") {
    subendDate = addDays(180);
    subName = "6 Months";
  } else if (req.body["form_id"] === "0a0bfd2") {
    subendDate = addDays(365);
    subName = "1 Year";
  } else {
    subendDate = addDays(1000);
    subName = "Free NewsLetter";
  }
  setBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `91${req.body["Phone"]}`,
    type: "template",
    template: {
      name: "kids_reg",
      language: {
        code: "en",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: req.body["Name"],
            },
            {
              type: "text",
              text: subName,
            },
          ],
        },
      ],
    },
  };
  const { data, error } = await supabase
    .from("users")
    .select("name,phone,email")
    .eq("phone", req.body["Phone"])
    .single();
  if (data === null) {
    console.log("User is New Inserting Now");
    const { error } = await supabase.from("users").insert({
      name: req.body["Name"],
      phone: req.body["Phone"],
      email: req.body["Email"],
      addr: req.body["Address"],
      subend: subendDate,
      payid: subName,
    });
  } else {
    console.log("User is Available Updating It");
    const { error } = await supabase
      .from("users")
      .update({ subend: subendDate })
      .eq("phone", req.body["Phone"]);
  }

  //>>>>>>>>>>>>> WHATSAPP ALERT <<<<<<<<<<<//
  await axios
    .post(
      `https://graph.facebook.com/v17.0/${process.env.PHONEID}/messages`,
      setBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
      }
    )
    .then(function (response) {
      // console.log(response);
      res.status(200).json({ success: response.data });
    })
    .catch(function (error) {
      console.log(error);
      res.status(407).send({ error: error });
    });
  next();
});

app.post("/wsp", (req, res, next) => {
  let dateTime = new Date();
  const membership =
    req.body["user_meta"]["pmpro_CardType"][0] === "" ? "Free" : "Premium";
  setBody = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `91${req.body["user_meta"]["phone"][0]}`,
    type: "template",
    template: {
      name: "kids_reg",
      language: {
        code: "en",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: req.body["user_meta"]["nickname"][0],
            },
            {
              type: "text",
              text: `${membership} Membership`,
            },
            {
              type: "text",
              text: req.body["data"]["user_email"],
            },
          ],
        },
      ],
    },
  };

  var finalRespObj = {};

  try {
    axios
      .post(
        `https://graph.facebook.com/v17.0/${process.env.PHONEID}/messages`,
        setBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TOKEN}`,
          },
        }
      )
      .then(function (response) {
        console.log(response);
        finalRespObj = { data: response.data };
      })
      .catch(function (error) {
        console.log(error);
        finalRespObj = { error: error };
      });
    res.status(201).json(finalRespObj);
  } catch (error) {
    res.status(407).json(finalRespObj);
  }
  next();
});

app.listen(port, () => {
  console.log(`Server Running at Port ${port}`);
});
