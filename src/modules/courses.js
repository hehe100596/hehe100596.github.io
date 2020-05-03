import { Router } from "express";
import mongoose, { Schema } from "mongoose";

const DataSchema = new Schema(
  {
    name: String,
    org: String,
    cat: String,
    level: String,
    length: String,
    status: String,
    author: String,
    access: [String],
    content: [
      {
        name: String,
        modules: [String],
        rewardMargin: Number,
        rewardPoints: Number,
        unlockPoints: Number,
        minPoints: Number,
        penalty: Number,
      },
    ],
  },
  { timestamps: true }
);
export const Course = mongoose.model("Course", DataSchema);
const router = Router();

router.post("/getCourse", (req, res) => {
  const { course } = req.body;

  Course.findOne({ _id: course }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getCourseWithAccess", (req, res) => {
  const { course, user } = req.body;

  Course.findOne({ _id: course, access: user }, "_id", (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getUsersWithAccess", (req, res) => {
  const { course } = req.body;

  Course.findOne({ _id: course }, "access", (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/giveAccess", (req, res) => {
  const { course, user } = req.body;

  Course.updateOne(
    { _id: course },
    { $push: { access: user } },
    (err, data) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true, data: data });
    }
  );
});

router.post("/getMyCourses", (req, res) => {
  const { user } = req.body;

  Course.find({ author: user }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/getAccessibleCourses", (req, res) => {
  const { user } = req.body;

  Course.find({ access: { $in: [user] } }, (err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data });
  });
});

router.post("/createNewCourse", (req, res) => {
  let course = new Course();

  const {
    name,
    org,
    cat,
    level,
    length,
    status,
    author,
    withAccess,
  } = req.body;

  course.name = name;
  course.org = org;
  course.cat = cat;
  course.level = level;
  course.length = length;
  course.status = status;
  course.author = author;

  course.access.push(withAccess);

  course.save((err, data) => {
    if (err) return res.json({ success: false, error: err });

    return res.json({ success: true, data: data._id });
  });
});

router.post("/updateCourseInfo", (req, res) => {
  const { courseId, name, org, cat, level, length, status } = req.body;

  Course.updateOne(
    { _id: courseId },
    {
      name: name,
      org: org,
      cat: cat,
      level: level,
      length: length,
      status: status,
    },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/getSection", (req, res) => {
  const { courseId, sectionId } = req.body;

  Course.findOne(
    { _id: courseId, "content._id": sectionId },
    "content.$",
    (err, data) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true, data: data.content[0] });
    }
  );
});

router.post("/addNewSection", (req, res) => {
  const { courseId, section } = req.body;

  Course.updateOne(
    { _id: courseId },
    { $push: { content: section } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/updateSection", (req, res) => {
  const { sectionId, courseId, section } = req.body;

  let newSection = {
    _id: sectionId,
    name: section.name,
    modules: section.modules,
    rewardMargin: section.rewardMargin,
    rewardPoints: section.rewardPoints,
    unlockPoints: section.unlockPoints,
    minPoints: section.minPoints,
    penalty: section.penalty,
  };

  Course.updateOne(
    { _id: courseId, "content._id": sectionId },
    { $set: { "content.$": newSection } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/removeStudents", (req, res) => {
  const { course, selectedUsers } = req.body;

  let tokens = [];
  selectedUsers.forEach(function (entry) {
    tokens.push(entry.token);
  });

  Course.updateOne(
    { _id: course },
    { $pull: { access: { $in: tokens } } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/removeSections", (req, res) => {
  const { course, selectedSections } = req.body;

  let sections = [];
  selectedSections.forEach(function (entry) {
    sections.push(entry._id);
  });

  Course.updateOne(
    { _id: course },
    { $pull: { content: { _id: { $in: sections } } } },
    (err) => {
      if (err) return res.json({ success: false, error: err });

      return res.json({ success: true });
    }
  );
});

router.post("/deleteCourses", (req, res) => {
  const { selectedCourses } = req.body;

  Course.deleteMany({ _id: { $in: selectedCourses } }, (err) => {
    if (err) return res.send(err);

    return res.json({ success: true });
  });
});

export default router;
