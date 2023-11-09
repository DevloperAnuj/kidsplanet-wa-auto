require("dotenv").config();
const express = require("express");
const app = express();
const request = require("request");
const morgan = require("morgan");
const port = process.env.PORT;

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Its Get Request");
  res.json({
    success: true,
  });
});

app.post("/wsp", (req, res, next) => {
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

  // console.log(req.body["user_meta"]);
  // console.log("=======================================");
  // console.log(req.body["user_meta"]["nickname"][0]);
  // console.log(req.body["data"]["user_email"]);
  // console.log(req.body["user_meta"]["phone"][0]);
  // console.log(membership);

  try {
    request.post(
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
          console.log({ success: true });
        } else {
          console.log(body);
          console.log(err);
        }
      }
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(407).json({ err: error });
  }
  next();
});

app.listen(port, () => {
  console.log(`Server Running at Port ${port}`);
});
