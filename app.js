require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const request = require("request");
const morgan = require("morgan");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const port = process.env.PORT;
const csvWriter = createCsvWriter({
  path: __dirname + "/file.csv",
  header: [
    { id: "name", title: "NAME" },
    { id: "number", title: "NUMBER" },
    { id: "date", title: "DATELOG" },
  ],
});

let assessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});

app.use(morgan("combined"));
app.use(morgan("combined", { stream: assessLogStream }));
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Its Get Request");
  res.status(200).json({
    success: true,
  });
});

app.get("/log", (req, res) => {
  filePath = path.join(__dirname, "access.log");
  fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
    if (!err) {
      console.log("received data: " + data);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write(data);
      res.end();
    } else {
      console.log(err);
    }
  });
});

app.get("/user", (req, res) => {
  filePath = path.join(__dirname, "file.csv");
  fs.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
    if (!err) {
      console.log("received data: " + data);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.write(data);
      res.end();
    } else {
      console.log(err);
    }
  });
});

app.post("/wsp", async (req, res, next) => {
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
  const record = [
    {
      name: req.body["user_meta"]["nickname"][0],
      number: `91${req.body["user_meta"]["phone"][0]}`,
      date: `${dateTime}`,
    },
  ];

  // console.log(req.body["user_meta"]);
  // console.log("=======================================");
  // console.log(req.body["user_meta"]["nickname"][0]);
  // console.log(req.body["data"]["user_email"]);
  // console.log(req.body["user_meta"]["phone"][0]);
  // console.log(membership);

  let finalRespObj = {};

  try {
    await request.post(
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
        url: `https://graph.facebook.com/v17.0/${process.env.PHONEID}/messages`,
        body: JSON.stringify(setBody),
      },
      (err, resp, body) => {
        if (!err && resp.statusCode === 200) {
          console.log({ postBody: setBody, response: body });
          finalRespObj = { postBody: setBody, response: body };
        } else {
          console.log(err);
          finalRespObj = { postBody: setBody, error: err };
        }
      }
    );
    await csvWriter
      .writeRecords(record) // returns a promise
      .then(() => {
        console.log("...Done Writing In CSV" + record);
      });
    res.status(201).json(finalRespObj);
  } catch (error) {
    console.log(error);
    res.status(407).json(finalRespObj);
  }
  next();
});

app.listen(port, () => {
  console.log(`Server Running at Port ${port}`);
});
