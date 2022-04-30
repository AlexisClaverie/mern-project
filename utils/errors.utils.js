module.exports.signUpErrors = (err) => {
  let errors = { pseudo: "", email: "", password: "" };

  err.message.includes("pseudo")
    ? (errors.pseudo = "Le pseudo n'est pas valide")
    : "";

  err.message.includes("expected `pseudo` to be unique")
    ? (errors.pseudo = "Ce pseudo est déjà pris")
    : "";

  err.message.includes("email") ? (errors.email = "Email incorrect") : "";

  err.message.includes("password")
    ? (errors.password = "Le mot de passe doit faire 6 caractères minimum")
    : "";
  err.message.includes("expected `email` to be unique")
    ? (errors.email = "Cet email est déjà pris")
    : "";

  return errors;
};

module.exports.signInErrors = (err) => {
  let errors = { email: "", password: "" };

  if (err.message.includes("email")) errors.email = "Email incorrect";
  if (err.message.includes("password"))
    errors.password = "Mauvais mot de passe";

  return errors;
};

module.exports.uploadErrors = (err, maxSize, fileSize) => {
  let errors = { format: "", maxSize: "" };
  const maxSizeAllowed = maxSize / 1000;

  if (err.message.includes("Invalid file"))
    errors.format = "Format incompatible";

  if (err.message.includes("Max size"))
    errors.maxSize = `Fichier trop grand (${fileSize} Ko), il ne doit pas dépasser les ${maxSizeAllowed} Ko`;

  return { errors };
};
