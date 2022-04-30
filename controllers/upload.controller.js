const UserModel = require("../models/user.model");
const fs = require("fs");
const { promisify } = require("util");
const { uploadErrors } = require("../utils/errors.utils");
const pipeline = promisify(require("stream").pipeline);

module.exports.uploadProfil = async (req, res) => {
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

  const fileName = req.body.name + ".jpg";

  await pipeline(
    req.file.stream,
    fs.createWriteStream(
      `${__dirname}/../client/public/uploads/profil/${fileName}`
    )
  );
  try {
    await UserModel.findByIdAndUpdate(
      req.body.userId,
      { $set: { picture: "./uploads/profil/" + fileName } },
      {
        new: true,
        upsert: true,
        setDefaultOnInsert: true,
      },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(500).send(err);
      }
    );
  } catch (error) {
    return res.status(500).send(err);
  }
};
