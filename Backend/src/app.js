import express from 'express';
import {createServer} from "node:http";

import {Server} from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from './Controllers/socketManager.js';

import cors from "cors";
import userRoutes from "./routes/user.routes.js"

const app = express();
const server = createServer(app);
// const io = new connectToSocket(server)
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({limit:'40kb'}));
app.use(express.urlencoded({limit:'40kb', extended:true}));

app.use("/api/v1/user", userRoutes);


const start = async () => {
    const connectionDb = await mongoose.connect("mongodb://yuvrajmnale_db_user:yuvraj%408551@ac-e6saoyv-shard-00-00.qrwjctr.mongodb.net:27017,ac-e6saoyv-shard-00-01.qrwjctr.mongodb.net:27017,ac-e6saoyv-shard-00-02.qrwjctr.mongodb.net:27017/?ssl=true&replicaSet=atlas-l4trnw-shard-0&authSource=admin&appName=Cluster0")

    console.log(`MongoDB connected`)
    server.listen(app.get("port"), ()=> {
        console.log("app is listen on port 8000")
    });
}

start();