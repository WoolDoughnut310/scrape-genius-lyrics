import dotenv from "dotenv";
dotenv.config();

import { client } from "./authClient";

import express, { NextFunction, Request, Response } from "express";
import { search, extractLyrics } from "./genius";
import https from "https";
import fs from "fs";
import asyncHandler from "express-async-handler";

const options = {
    key: fs.readFileSync("./keys/localhost-key.pem"),
    cert: fs.readFileSync("./keys/localhost.pem"),
};

const app = express();

const server = https.createServer(options, app);

const port = 3000;
const URL = `https://localhost:${port}`;

const redirectPath = "/auth/callback";
const redirectUri = `${URL}${redirectPath}`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authorizationUrl = client.authorizeURL({
    redirect_uri: redirectUri,
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/auth", (req, res) => {
    console.log(authorizationUrl);
    res.redirect(authorizationUrl);
});

app.get(
    redirectPath,
    asyncHandler(async (req, res) => {
        const { code } = req.query;

        const options = {
            code: code as string,
            redirect_uri: redirectUri,
        };

        const token = await client.getToken(options);

        res.status(200).json(token.token.access_token);
    })
);

app.post(
    "/lyrics",
    asyncHandler(async (req, res) => {
        const { q, access_token } = req.body;

        const song = await search(access_token, q);

        // Parse url for lyrics with cheerio
        const lyrics = await extractLyrics(song.url);

        res.status(200).json(lyrics);
    })
);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

server.listen(port, () => {
    return console.log(`Express is listening at ${URL}`);
});
