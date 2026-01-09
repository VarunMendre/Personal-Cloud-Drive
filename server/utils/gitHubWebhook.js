import crypto from "crypto";

export const gitHubWebhook = async (req, res, next) => {
  const originalSignature = req.headers["x-hub-signature-256"];
  if (!originalSignature) {
    return res.status(401).json({ message: "Invalid Signature" });
  }
  const generatedSignature =
    "sha256=" +
    crypto
      .createHmac("SHA-256", process.env.GITHUB_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

  const buffer1 = Buffer.from(originalSignature);
  const buffer2 = Buffer.from(generatedSignature);

  if (buffer1.length !== buffer2.length) {
    return res.status(401).json({ message: "Invalid Signature" });
  }

  if (!crypto.timingSafeEqual(buffer1, buffer2)) {
    return res.status(401).send("Invalid Signature");
  }

  res.json({ message: "OK" });

  next();
};
