const PostModel = require("../models/post.model");
const UserModel = require("../models/user.model");
const fs = require("fs");
const { promisify } = require("util");
const { uploadErrors } = require("../utils/errors.utils");
const pipeline = promisify(require("stream").pipeline);
const ObjectId = require("mongoose").Types.ObjectId;

let time = new Date().getTime();

module.exports.readPost = (req, res) => {
  PostModel.find((err, docs) => {
    !err ? res.send(docs) : console.log("Error to get data" + err);
  }).sort({ createdAt: -1 });
};

module.exports.createPost = async (req, res) => {
  let fileName;

  if (req.file !== null) {
    const maxSize = 500000;
    try {
      if (
        req.file.detectedMimeType !== "image/jpg" &&
        req.file.detectedMimeType !== "image/png" &&
        req.file.detectedMimeType !== "image/jpeg"
      )
        throw Error("Invalid file");

      if (req.file.size > maxSize) throw Error("Max size");
    } catch (error) {
      const fileSize = req.file.size / 1000; // size converted in Ko
      const errors = uploadErrors(error, maxSize, fileSize);
      return res.status(201).json(errors);
    }

    fileName = req.body.posterId + Date.now() + ".jpg";

    await pipeline(
      req.file.stream,
      fs.createWriteStream(
        `${__dirname}/../client/public/uploads/posts/${fileName}`
      )
    );
  }

  const newPost = new PostModel({
    posterId: req.body.posterId,
    message: req.body.message,
    picture: req.file !== null ? "./uploads/posts/" + fileName : "",
    video: req.body.video,
    likers: [],
    comments: [],
  });
  try {
    const post = await newPost.save();
    return res.status(201).json(post);
  } catch (error) {
    return res.status(400).send(err);
  }
};

module.exports.updatePost = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  const updatedRecord = {
    message: req.body.message,
  };

  await PostModel.findByIdAndUpdate(
    req.params.id,
    {
      $set: updatedRecord,
    },
    { new: true },
    (err, docs) => {
      if (!err) res.send(docs);
      else console.log("update error : " + err);
    }
  );
};
module.exports.deletePost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  PostModel.findByIdAndDelete(req.params.id, (err, docs) => {
    if (!err) res.send(docs);
    else console.log("Delete error : " + err);
  });
};

module.exports.likePost = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: {
          likers: req.body.id,
        },
      },
      { new: true },
      (err, docs) => {
        if (err) res.status(400).send(err);
      }
    );
    await UserModel.findByIdAndUpdate(
      req.body.id,
      {
        $addToSet: {
          likes: req.params.id,
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) res.send(docs);
        else res.status(400).send(err);
      }
    );
  } catch (error) {
    res.send(error);
  }
};

module.exports.unlikePost = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    await PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          likers: req.body.id,
        },
      },
      { new: true },
      (err, docs) => {
        if (err) res.send(err);
      }
    );

    await UserModel.findByIdAndUpdate(
      req.body.id,
      {
        $pull: {
          likes: req.params.id,
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) res.send(docs);
        else res.send(err);
      }
    );
  } catch (error) {
    res.send(error);
  }
};

module.exports.commentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    return PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          },
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(400).send(err);
      }
    );
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports.deleteCommentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          comments: {
            _id: req.body.commentId,
          },
        },
      },
      { new: true },

      (err, docs) => {
        if (!err) res.send(docs);
        else res.send(err);
      }
    );
  } catch (error) {}
};

module.exports.editCommentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send("ID unknown : " + req.params.id);

  try {
    PostModel.findById(
      req.params.id,

      (err, docs) => {
        const theComment = docs.comments.find((comment) =>
          comment._id.equals(req.body.commentId)
        );

        if (!theComment) return res.status(404).send("Comment not found");
        theComment.text = req.body.text;

        return docs.save((err) => {
          if (!err) return res.status(200).send(docs);
          return res.status(500).send(err);
        });
      }
    );
  } catch (error) {
    return res.status(400).send(err);
  }
};
