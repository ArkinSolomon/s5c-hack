"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Converter = exports.ffmpeg = void 0;
const child_process_1 = require("child_process");
const debug_1 = require("debug");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const stream_1 = require("stream");
const util_1 = require("util");
const dbg = debug_1.debug("ffmpeg-stream");
const { FFMPEG_PATH = "ffmpeg" } = process.env;
const EXIT_CODES = [0, 255];
function debugStream(stream, name) {
    stream.on("error", err => {
        dbg(`${name} error: ${err.message}`);
    });
    stream.on("data", (data) => {
        dbg(`${name} data: ${data.length} bytes`);
    });
    stream.on("finish", () => {
        dbg(`${name} finish`);
    });
}
function getTmpPath(prefix = "", suffix = "") {
    const dir = os_1.tmpdir();
    const id = Math.random().toString(32).substr(2, 10);
    return path_1.join(dir, `${prefix}${id}${suffix}`);
}
function getArgs(options) {
    const args = [];
    for (const option in options) {
        const value = options[option];
        if (Array.isArray(value)) {
            for (const element of value) {
                if (element != null) {
                    args.push(`-${option}`);
                    args.push(String(element));
                }
            }
        }
        else if (value != null && value !== false) {
            args.push(`-${option}`);
            if (typeof value != "boolean") {
                args.push(String(value));
            }
        }
    }
    return args;
}
/** @deprecated Construct [[Converter]] class directly */
function ffmpeg() {
    return new Converter();
}
exports.ffmpeg = ffmpeg;
class Converter {
    constructor() {
        this.fdCount = 0;
        this.pipes = [];
        this.killed = false;
    }
    input(arg0, arg1) {
        const [file, opts = {}] = typeof arg0 == "string" ? [arg0, arg1] : [undefined, arg0];
        if (file != null) {
            return void this.createInputFromFile(file, opts);
        }
        if (Boolean(opts.buffer)) {
            delete opts.buffer;
            return this.createBufferedInputStream(opts);
        }
        return this.createInputStream(opts);
    }
    output(arg0, arg1) {
        const [file, opts = {}] = typeof arg0 == "string" ? [arg0, arg1] : [undefined, arg0];
        if (file != null) {
            return void this.createOutputToFile(file, opts);
        }
        if (Boolean(opts.buffer)) {
            delete opts.buffer;
            return this.createBufferedOutputStream(opts);
        }
        return this.createOutputStream(opts);
    }
    createInputFromFile(file, options) {
        this.pipes.push({
            type: "input",
            options,
            file,
        });
    }
    createOutputToFile(file, options) {
        this.pipes.push({
            type: "output",
            options,
            file,
        });
    }
    createInputStream(options) {
        const stream = new stream_1.PassThrough();
        const fd = this.getUniqueFd();
        this.pipes.push({
            type: "input",
            options,
            file: `pipe:${fd}`,
            onSpawn: process => {
                const stdio = process.stdio[fd];
                if (stdio == null)
                    throw Error(`input ${fd} is null`);
                debugStream(stream, `input ${fd}`);
                if (!("write" in stdio))
                    throw Error(`input ${fd} is not writable`);
                stream.pipe(stdio);
            },
        });
        return stream;
    }
    createOutputStream(options) {
        const stream = new stream_1.PassThrough();
        const fd = this.getUniqueFd();
        this.pipes.push({
            type: "output",
            options,
            file: `pipe:${fd}`,
            onSpawn: process => {
                const stdio = process.stdio[fd];
                if (stdio == null)
                    throw Error(`output ${fd} is null`);
                debugStream(stdio, `output ${fd}`);
                stdio.pipe(stream);
            },
        });
        return stream;
    }
    createBufferedInputStream(options) {
        const stream = new stream_1.PassThrough();
        const file = getTmpPath("ffmpeg-");
        this.pipes.push({
            type: "input",
            options,
            file,
            onBegin: async () => {
                await new Promise((resolve, reject) => {
                    const writer = fs_1.createWriteStream(file);
                    stream.pipe(writer);
                    stream.on("end", () => {
                        dbg("input buffered stream end");
                        resolve();
                    });
                    stream.on("error", err => {
                        dbg(`input buffered stream error: ${err.message}`);
                        return reject(err);
                    });
                });
            },
            onFinish: async () => {
                await util_1.promisify(fs_1.unlink)(file);
            },
        });
        return stream;
    }
    createBufferedOutputStream(options) {
        const stream = new stream_1.PassThrough();
        const file = getTmpPath("ffmpeg-");
        this.pipes.push({
            type: "output",
            options,
            file,
            onFinish: async () => {
                await new Promise((resolve, reject) => {
                    const reader = fs_1.createReadStream(file);
                    reader.pipe(stream);
                    reader.on("end", () => {
                        dbg("output buffered stream end");
                        resolve();
                    });
                    reader.on("error", (err) => {
                        dbg(`output buffered stream error: ${err.message}`);
                        reject(err);
                    });
                });
                await util_1.promisify(fs_1.unlink)(file);
            },
        });
        return stream;
    }
    async run() {
        var _a, _b, _c;
        const pipes = [];
        try {
            for (const pipe of this.pipes) {
                dbg(`prepare ${pipe.type}`);
                await ((_a = pipe.onBegin) === null || _a === void 0 ? void 0 : _a.call(pipe));
                pipes.push(pipe);
            }
            const command = this.getSpawnArgs();
            const stdio = this.getStdioArg();
            dbg(`spawn: ${FFMPEG_PATH} ${command.join(" ")}`);
            dbg(`spawn stdio: ${stdio.join(" ")}`);
            this.process = child_process_1.spawn(FFMPEG_PATH, command, { stdio });
            const finished = this.handleProcess();
            for (const pipe of this.pipes) {
                (_b = pipe.onSpawn) === null || _b === void 0 ? void 0 : _b.call(pipe, this.process);
            }
            if (this.killed) {
                // the converter was already killed so stop it immediately
                this.process.kill();
            }
            await finished;
        }
        finally {
            for (const pipe of pipes) {
                await ((_c = pipe.onFinish) === null || _c === void 0 ? void 0 : _c.call(pipe));
            }
        }
    }
    kill() {
        var _a;
        // kill the process if it already started
        (_a = this.process) === null || _a === void 0 ? void 0 : _a.kill();
        // set the flag so it will be killed after it's initialized
        this.killed = true;
    }
    getUniqueFd() {
        return this.fdCount++ + 3;
    }
    getStdioArg() {
        return ["ignore", "ignore", "pipe", ...Array(this.fdCount).fill("pipe")];
    }
    getSpawnArgs() {
        const command = [];
        for (const pipe of this.pipes) {
            if (pipe.type !== "input")
                continue;
            command.push(...getArgs(pipe.options));
            command.push("-i", pipe.file);
        }
        for (const pipe of this.pipes) {
            if (pipe.type !== "output")
                continue;
            command.push(...getArgs(pipe.options));
            command.push(pipe.file);
        }
        return command;
    }
    async handleProcess() {
        await new Promise((resolve, reject) => {
            let logSectionNum = 0;
            const logLines = [];
            if (this.process == null)
                return reject(Error(`Converter not started`));
            if (this.process.stderr != null) {
                this.process.stderr.setEncoding("utf8");
                this.process.stderr.on("data", (data) => {
                    const lines = data.split(/\r\n|\r|\n/u);
                    for (const line of lines) {
                        // skip empty lines
                        if (/^\s*$/u.exec(line) != null)
                            continue;
                        // if not indented: increment section counter
                        if (/^\s/u.exec(line) == null)
                            logSectionNum++;
                        // only log sections following the first one
                        if (logSectionNum > 1) {
                            dbg(`log: ${line}`);
                            logLines.push(line);
                        }
                    }
                });
            }
            this.process.on("error", err => {
                dbg(`error: ${err.message}`);
                return reject(err);
            });
            this.process.on("exit", (code, signal) => {
                dbg(`exit: code=${code !== null && code !== void 0 ? code : "unknown"} sig=${signal !== null && signal !== void 0 ? signal : "unknown"}`);
                if (code == null)
                    return resolve();
                if (EXIT_CODES.includes(code))
                    return resolve();
                const log = logLines.map(line => `  ${line}`).join("\n");
                reject(Error(`Converting failed\n${log}`));
            });
        });
    }
}
exports.Converter = Converter;
