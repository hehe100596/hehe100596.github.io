import { Router } from "express";
import mongoose, { Schema } from "mongoose";
import moment from "moment";
import * as bcrypt from "bcrypt";

const DataSchema = new Schema(
  {
    link: String,
    courseName: String,
    courseId: String,
    expirationDate: {
      type: Date,
      expires: 0
    }
  },
  { timestamps: true }
);
mongoose.set("useCreateIndex", true);

const Invite = mongoose.model("Invite", DataSchema);
const router = Router();

router.post("/getInviteLink", (req, res) => {
  const { link } = req.body;

  Invite.findOne({ link: link }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/createNewInviteLink", async (req, res) => {
  let invite = new Invite();

  let link = await bcrypt.hash(invite.id, 10);

  const { courseName, courseId, expiration } = req.body;

  link = link.replace(/\//g, "0");

  invite.link = link;
  invite.courseName = courseName;
  invite.courseId = courseId;
  invite.expirationDate = moment().add(parseInt(expiration), "minutes");

  invite.save(err => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: link });
  });
});

export default router;
