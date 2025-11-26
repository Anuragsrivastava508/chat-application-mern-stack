// import jwt from "jsonwebtoken";

// export const generateToken = (userId, res) => {
//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });

//   res.cookie("jwt", token, {
//     maxAge: 7 * 24 * 60 * 60 * 1000, // MS
//     httpOnly: true, // prevent XSS attacks cross-site scripting attacks
//     sameSite: "strict", // CSRF attacks cross-site request forgery attacks
//     secure: process.env.NODE_ENV !== "development",
//   });

//   return token;
// };


import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,        // required for HTTPS on Render
    sameSite: "none",    // allow cross-domain cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};
