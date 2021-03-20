/// <reference types="node" />
import type { Readable, Writable } from "stream";
declare type Options = Record<string, string | number | boolean | Array<string | null | undefined> | null | undefined>;
/** @deprecated Construct [[Converter]] class directly */
export declare function ffmpeg(): Converter;
export declare class Converter {
    private fdCount;
    private readonly pipes;
    private process?;
    private killed;
    /** @deprecated Use [[createInputStream]] or [[createInputFromFile]] */
    input(options?: Options): Writable;
    input(file: string, options?: Options): void;
    /** @deprecated Use [[createOutputStream]] or [[createOutputToFile]] */
    output(options?: Options): Readable;
    output(file: string, options?: Options): void;
    createInputFromFile(file: string, options: Options): void;
    createOutputToFile(file: string, options: Options): void;
    createInputStream(options: Options): Writable;
    createOutputStream(options: Options): Readable;
    createBufferedInputStream(options: Options): Writable;
    createBufferedOutputStream(options: Options): Readable;
    run(): Promise<void>;
    kill(): void;
    private getUniqueFd;
    private getStdioArg;
    private getSpawnArgs;
    private handleProcess;
}
export {};
