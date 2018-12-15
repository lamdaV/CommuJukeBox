require("dotenv").config();
const express = require("express");
const expressStatusMonitor = require("express-status-monitor");
const errorhandler = require("errorhandler");
const bodyParser = require("body-parser");
const compression = require("compression");
const expressValidator = require("express-validator");
const { body, header, validationResult } = require("express-validator/check");
const cors = require("cors");
const http = require("http");
const parse = require("url-parse");
const qs = require("query-string");
const socket = require("socket.io");
const crypto = require("crypto");
const path = require("path");

const app = express();
const server = http.Server(app);
const io = socket(server);

app.set("host", process.env.HOST || "localhost");
app.set("port", process.env.SERVER_PORT || 8080);

app.use(expressStatusMonitor());
app.use(expressValidator());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors({
   origin: true,
   credentials: true
}));
app.use(compression());

app.all("*", (request, response, next) => {
  request.header("Accept", "application/json");
  request.header("Accept-Language", "en-US");

  console.log(`${request.method} ${request.originalUrl} hit with: query => ${JSON.stringify(request.query)} body => ${JSON.stringify(request.body)}`);

  next();
});

const PRIVILEDGED_USER = process.env.PRIVILEDGED_USER;
const PRIVILEDGED_TOKEN = process.env.PRIVILEDGED_TOKEN;
const songValidation = body("url")
  .exists()
  .withMessage("url is missing")
  .isURL({
    protocols: ["http", "https"],
    require_protocol: true,
    allow_underscores: true
  })
  .withMessage("url field contains non-url value");
const tokenValidation = body("token")
  .exists()
  .withMessage("token is missing");
app.post("/api/song", [songValidation, tokenValidation], (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400)
      .json({errors: errors.array()})
      .send();
  }
  
  if (PRIVILEDGED_TOKEN === request.body.token) {
    return publishSong(request.body.url, PRIVILEDGED_USER, 
      () => response.status(400).json({errors: ["invalid url: hostname must be youtube.com or youtu.be"]}).send(),
      () => response.status(500).json({errors: ["issue with server"]}).send(),
      () => response.status(400).json({errors: ["invalid url: video id was malformed"]}).send(),
      () => response.status(202).send());
  }
});

const SLACK_VERSION = process.env.SLACK_VERSION;
const SLACK_VERIFICATION_SECRET = process.env.SLACK_VERIFICATION_SECRET;
const slackSongValidation = body("text")
  .exists()
  .withMessage("text is missing")
  .isURL({
    protocols: ["http", "https"],
    require_protocol: true,
    allow_underscores: true
  })
  .withMessage("url field contains non-url value");
const slackUserIdValidation = body("user_id")
  .exists()
  .withMessage("user_id is missing")
  .isString()
  .withMessage("user_id is not a string")
  .not().isEmpty()
  .withMessage("user_id is empty");
const slackTimestampValidation = header("X-Slack-Request-Timestamp")
  .exists()
  .withMessage("slack header missing")
  .isNumeric()
  .withMessage("slack header malformed");
const slackSignatureValidation = header("X-Slack-Signature")
  .exists()
  .withMessage("slack header missing")
  .isString()
  .withMessage("slack header malformed");
app.post("/api/slack", [slackSongValidation, slackUserIdValidation, slackTimestampValidation, slackSignatureValidation], (request, response) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(200)
      .json({response_type: "ephemeral", text: JSON.stringify(errors.array().map((value) => value.msg))})
      .send();
  }

  const slackTimestamp = request.header["X-Slack-Request-Timestamp"];
  const signatureBase = `${SLACK_VERSION}:${slackTimestamp}:${request.body}`;
  if (Math.abs(Date.now() - slackTimestamp) <= 5 * 60 * 1000) {
    return response.status(200)
      .json({response_type: "ephemeral", text: "request is too old. pleas try again"})
      .send();
  }
  
  const hash = crypto.createHmac("sha256", SLACK_VERIFICATION_SECRET)
    .update(signatureBase)
    .digest("hex");
  const slackSignature = request.header["X-Slack-Signature"];
  if (crypto.timingSafeEqual(Buffer.of(hash), Buffer.of(slackSignature))) {
    return publishSong(request.body.text, request.body.user_id,
      () => response.status(200).json({response_type: "ephemeral", text: "invalid url: hostname must be youtube.com or youtu.be"}).send(),
      () => response.status(200).json({response_type: "ephemeral", text: "too many request sent"}).send(),
      () => response.status(200).json({response_type: "ephemeral", text: "invalid url: video id was malformed"}).send(),
      () => response.status(202).json({response_type: "ephemeral", text: "request received"}).send());
  }
  return response.status(200)
    .json({response_type: "ephemeral", text: "invalid request"})
    .send();
});

const userMap = new Map();
const publishSong = (url, userId, onUrlError, onUserLimitError, onBadVideo, onSuccess) => {
  const parsedURL = parse(url);
  if (!(parsedURL.hostname.endsWith("youtube.com") 
    || parsedURL.hostname.endsWith("youtu.be"))) {
    return onUrlError()
  }

  if (userId !== PRIVILEDGED_USER && userMap.has(userId)) {
    let userTimeout = userMap.get(userId);
    if (Date.now() < userTimeout) {
      return onUserLimitError()
    }
  }

  let videoId;
  if (parsedURL.hostname.endsWith("youtu.be")) {
    videoId = parsedURL.pathname.substr(1);
  } else {
    const queries = qs.parse(parsedURL.query);
    if (queries.v) {
      videoId = queries.v;
    }
  }

  if (videoId) {
    io.to("jukebox").emit("videos", videoId);
    userMap.set(userId, Date.now() + 5 * 60 * 1000);
    return onSuccess();
  } else {
    return onBadVideo();
  }
}

io.on("connection", (socket) => {
  console.log(`${socket.handshake.address} connected`);
  socket.join("jukebox");
});

io.on("disconnect", (socket) => {
  console.log(`${socket.handshake.address} disconnected`);
  socket.leave("jukebox");
});

app.use(express.static(path.join(__dirname, "..", "build"), {maxAge: "1w"}));
app.get("*", (request, response) => {
  response.status(200)
    .type("html")
    .sendFile(path.join(__dirname, "..", "build"), "index.html");
});

if (process.env.NODE_ENV !== "production") {
  app.use(errorhandler());
}

app.listen(app.get("port"), (error) => {
  if (error) {
    console.log(`Server failed to start: ${error}`);
  } else {
    console.log(`Server listening on ${app.get("host")}:${app.get("port")}`);
  }
});

const ioPort = process.env.REACT_APP_IO_PORT || 8081;
server.listen(ioPort, (error) => {
  if (error) {
    console.error(`IO server failed to start: ${error}`);
  } else {
    console.log(`IO server listening on ${app.get("host")}:${ioPort}`);
  }
});