"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const core = __importStar(require("@actions/core"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function uploadFile(client, local, remote, ignore = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const paths = glob_1.default.sync(path_1.default.join(local, '**/*'), { ignore: ignore || [] });
        const files = paths.filter((f) => fs_1.default.statSync(f).isFile());
        const dirs = paths.filter((f) => fs_1.default.statSync(f).isDirectory());
        yield Promise.all(dirs.map((d) => client.mkdir(d.replace(local, remote), true)));
        return Promise.all(files.map((f) => {
            return client.fastPut(f, f.replace(local, remote)).then((res) => {
                core.info(`UPLOAD FILE SUCCESS ----> ${res}`);
                return true;
            })
                .catch((e) => {
                core.info(`UPLOAD FILE ERROR ----> ${e.message}`);
                return false;
            });
        })).then((status) => status.every((s) => !!s)).then((re) => {
            client.end();
            return re;
        });
    });
}
exports.uploadFile = uploadFile;
