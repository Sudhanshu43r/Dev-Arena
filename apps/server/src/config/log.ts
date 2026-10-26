import {pino} from "pino";

const tranport = pino.transport({
    target: "pino-pretty",
    options:{
        colorize: true,
        destination: {path: "./logs/server.log",mkdir: true}
    }
})
const logger = pino({
    level: process.env.LOG_LEVEL || "info",
},tranport);

export {logger};