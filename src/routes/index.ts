import { Router } from "express";
import { readdirSync } from "fs";

const PATH_ROUTER = `${__dirname}`;
const router = Router();

/** 
 * 
 * @returns
 */
const cleanFileName = (fileName: string) => {
    const file = fileName.split(".").shift();
    return file;
};

readdirSync(PATH_ROUTER).filter((fileName) => {
    console.log(cleanFileName(fileName));
});

export { router};