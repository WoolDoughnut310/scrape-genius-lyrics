import dotenv from "dotenv";
dotenv.config();

import { client } from "./authClient";

import express, { Request, Response } from "express";
import { search, extractLyrics } from "./genius";

const app = express();
const port = 3000;
const URL = `http://localhost:${port}`;

const redirectPath = "/auth/callback";
const redirectUri = `${URL}${redirectPath}`;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authorizationUrl = client.authorizeURL({
    redirect_uri: "http://localhost:3000/auth/callback",
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/auth", (req, res) => {
    console.log(authorizationUrl);
    res.redirect(authorizationUrl);
});

app.get(redirectPath, async (req, res) => {
    const { code } = req.query;

    const options = {
        code: code as string,
        redirect_uri: redirectUri,
    };

    const token = await client.getToken(options);

    res.status(200).json(token);
});

app.post("/lyrics", async (req, res) => {
    const { q, access_token } = req.body;

    const song = await search(access_token, q);

    // Parse url for lyrics with cheerio
    const lyrics = await extractLyrics(song.url);

    res.status(200).json(lyrics);
});

app.use((err: Error, req: Request, res: Response) => {
    res.status(500).json({ message: err.message });
});

app.listen(port, () => {
    return console.log(`Express is listening at ${URL}`);
});
