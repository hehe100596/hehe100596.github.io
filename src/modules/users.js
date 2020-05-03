import { Router } from "express";
import mongoose, { Schema } from "mongoose";
import * as bcrypt from "bcrypt";

import { Course } from "./courses";
import { Module } from "./modules";

const DataSchema = new Schema(
  {
    mail: String,
    name: String,
    pass: String,
    token: String,
    progress: [
      { course: String, rewards: [{ section: String, points: Number }] },
    ],
  },
  { timestamps: true }
);
const User = mongoose.model("User", DataSchema);
const router = Router();

router.post("/getUser", async (req, res) => {
  const { mail, pass } = req.body;

  User.findOne({ mail: mail }, "name token pass", (err, data) => {
    if (err) return res.json({ success: false, error: err });

    if (data) {
      bcrypt.compare(pass, data.pass, async function (err, ans) {
        if (ans) {
          return res.json({ success: true, data: data });
        } else {
          return res.json({ success: false, error: err });
        }
      });
    } else return res.json({ success: true, data: data });
  });
});

router.post("/getSelectedUsers", (req, res) => {
  const { tokens } = req.body;

  User.find(
    { token: { $in: tokens } },
    "name mail progress token",
    (err, data) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true, data: data });
    }
  );
});

router.post("/getUserMail", (req, res) => {
  const { mail } = req.body;

  User.findOne({ mail: mail }, "mail", (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getUserToken", (req, res) => {
  const { mail } = req.body;

  User.findOne({ mail: mail }, "token", (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/createNewUser", async (req, res) => {
  let user = new User();

  const { mail, name, pass } = req.body;

  const hashedPass = await bcrypt.hash(pass, 10);
  const token = await bcrypt.hash(mail, 10);

  user.mail = mail;
  user.name = name;
  user.pass = hashedPass;
  user.token = token;

  user.save((err) => {
    if (err) return res.json({ success: false, error: err });

    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: mail,
      from: "dp_app@info.com",
      subject: "Registration Complete",
      text:
        "You were successfully registered on DP App.\n" +
        "If it was not you, contact us here: XXX",
    };
    sgMail.send(msg);

    return res.json({ success: true });
  });
});

router.post("/changePassword", async (req, res) => {
  const { mail, token, pass } = req.body;

  const hashedPass = await bcrypt.hash(pass, 10);

  User.updateOne({ token: token }, { pass: hashedPass }, (err) => {
    if (err) return res.json({ success: false, error: err });

    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: mail,
      from: "dp_app@info.com",
      subject: "Password Changed",
      text:
        "Your password was successfully changed on DP App.\n" +
        "If it was not you who changed it, contact us here: XXX",
    };
    sgMail.send(msg);

    return res.json({ success: true });
  });
});

router.post("/saveProgress", async (req, res) => {
  const { user, course, section, points } = req.body;

  const newReward = {
    section: section,
    points: points,
  };

  User.findOne(
    {
      token: user,
      "progress.course": course,
    },
    (err, data) => {
      if (err) return res.json({ success: false, error: err });

      if (data) {
        User.updateOne(
          {
            token: user,
            "progress.course": course,
          },
          { $pull: { "progress.$.rewards": { section: section } } },
          (err) => {
            if (err) return res.json({ success: false, error: err });

            User.updateOne(
              {
                token: user,
                "progress.course": course,
              },
              { $push: { "progress.$.rewards": newReward } },
              (err) => {
                if (err) return res.json({ success: false, error: err });

                return res.json({ success: true });
              }
            );
          }
        );
      } else {
        User.updateOne(
          {
            token: user,
          },
          { $push: { progress: { course: course, rewards: [newReward] } } },
          (err) => {
            if (err) return res.json({ success: false, error: err });

            return res.json({ success: true });
          }
        );
      }
    }
  );
});

router.post("/deleteUser", (req, res) => {
  const { mail, token } = req.body;

  const user = User.deleteOne({ token: token });
  const courses = Course.updateMany(
    {},
    {
      $pull: { access: token },
    }
  );
  const modules = Module.updateMany(
    {},
    {
      $pull: { access: token },
    }
  );

  Promise.all([user, courses, modules])
    .then((result) => {
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        to: mail,
        from: "dp_app@info.com",
        subject: "Account Deleted",
        text:
          "Your account was successfully deleted from DP App.\n" +
          "If it was not you who did it, contact us here: XXX",
      };
      sgMail.send(msg);

      return res.json({ success: true });
    })
    .catch((err) => {
      return res.send(err);
    });
});

export default router;
