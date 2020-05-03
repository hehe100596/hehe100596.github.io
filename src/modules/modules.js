import { Router } from "express";
import mongoose, { Schema } from "mongoose";

import { Course } from "./courses";

const DataSchema = new Schema(
  {
    name: String,
    cat: String,
    type: String,
    author: String,
    limit: Number,
    timer: String,
    access: [String],
    content: [
      {
        name: String,
        sType: String,
        rqmt: String,
        points: Number,
        data: String,
        rnd: Boolean,
      },
    ],
  },
  { timestamps: true }
);
export const Module = mongoose.model("Module", DataSchema);
const router = Router();

router.post("/getModule", (req, res) => {
  const { module } = req.body;

  Module.findOne({ _id: module }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getModules", (req, res) => {
  const { modules } = req.body;

  Module.find({ _id: { $in: modules } }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getUsersWithAccess", (req, res) => {
  const { module } = req.body;

  Module.findOne({ _id: module }, "access", (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/giveAccess", (req, res) => {
  const { module, user } = req.body;

  Module.updateOne(
    { _id: module },
    { $push: { access: user } },
    (err, data) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true, data: data });
    }
  );
});

router.post("/getMyModules", (req, res) => {
  const { user } = req.body;

  Module.find({ author: user }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getAccessibleModules", (req, res) => {
  const { user } = req.body;

  Module.find({ access: { $in: [user] } }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/createNewModule", (req, res) => {
  let module = new Module();

  const { name, cat, type, author, limit, timer, withAccess } = req.body;

  module.name = name;
  module.cat = cat;
  module.type = type;
  module.author = author;
  module.limit = limit;
  module.timer = timer;

  module.access.push(withAccess);

  module.save((err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data._id });
  });
});

router.post("/updateModuleInfo", (req, res) => {
  const { moduleId, name, cat, type, limit, timer } = req.body;

  Module.updateOne(
    { _id: moduleId },
    { name: name, cat: cat, type: type, limit: limit, timer: timer },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/getSegment", (req, res) => {
  const { moduleId, segmentId } = req.body;

  Module.findOne(
    { _id: moduleId, "content._id": segmentId },
    "content.$",
    (err, data) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true, data: data.content[0] });
    }
  );
});

router.post("/addNewSegment", (req, res) => {
  const { moduleId, segment } = req.body;

  Module.updateOne(
    { _id: moduleId },
    { $push: { content: segment } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/updateSegment", (req, res) => {
  const { segmentId, moduleId, segment } = req.body;

  Module.updateOne(
    { _id: moduleId, "content._id": segmentId },
    { $set: { "content.$": segment } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/updateSegmentsOrder", (req, res) => {
  const { moduleId, segments } = req.body;

  Module.updateOne(
    { _id: moduleId },
    { $set: { content: segments } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/removeUsers", (req, res) => {
  const { module, selectedUsers } = req.body;

  let tokens = [];
  selectedUsers.forEach(function (entry) {
    tokens.push(entry.token);
  });

  Module.updateOne(
    { _id: module },
    { $pull: { access: { $in: tokens } } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/removeSegments", (req, res) => {
  const { module, selectedSegments } = req.body;

  let segments = [];
  selectedSegments.forEach(function (entry) {
    segments.push(entry._id);
  });

  Module.updateOne(
    { _id: module },
    { $pull: { content: { _id: { $in: segments } } } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/deleteModules", (req, res) => {
  const { selectedModules } = req.body;

  const modules = Module.deleteMany({ _id: { $in: selectedModules } });
  const courses = Course.updateMany(
    {},
    {
      $pull: { content: { module: { $in: selectedModules } } },
    }
  );

  Promise.all([modules, courses])
    .then((result) => {
      return res.json({ success: true });
    })
    .catch((err) => {
      return res.send(err);
    });
});

export default router;
