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
const core = __importStar(require("@actions/core"));
const ssh2_sftp_client_1 = __importDefault(require("ssh2-sftp-client"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
function uploadDir(client, local, remote, ignore = []) {
    return __awaiter(this, void 0, void 0, function* () {
        const exist = yield client.exists(remote);
        const files = glob_1.default.sync(path_1.default.join(local, '**/*'), { ignore: ignore || [] });
        const dirs = files.map(f => path_1.default.parse(f.replace(local, remote)).dir);
        if (!exist) {
            yield Promise.all(dirs.map(d => client.mkdir(d, true)));
        }
        return Promise.all(files.map(file => {
            core.info(`UPLOAD FILE START ----> ${file}`);
            return client
                .put(file, file.replace(local, remote))
                .then(() => {
                core.info(`UPLOAD FILE SUCCESS ----> ${file}`);
                return true;
            })
                .catch(() => {
                core.info(`UPLOAD FILE ERROR ----> ${file}`);
                return false;
            });
        })).then(sta => {
            client.end();
            return sta.every(s => !!s);
        });
    });
}
function setupClient(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new ssh2_sftp_client_1.default();
        return client
            .connect(options)
            .catch(() => null)
            .then(() => client)
            .catch(() => {
            core.info(`CONNECT ERROR ----> ${options.host}`);
            return null;
        });
    });
}
function parseClientOptions() {
    const host = core.getInput('host').split(',');
    const prot = core.getInput('port');
    const username = core.getInput('username');
    const password = core.getInput('password');
    return host.reduce((a, b) => {
        return a.concat({
            host: b,
            port: Number(prot),
            username,
            password
        });
    }, []);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const ignore = JSON.parse(core.getInput('ignore') || '[]');
        const local = path_1.default.join(process.cwd(), core.getInput('local'));
        const remote = core.getInput('remote');
        const options = parseClientOptions();
        const clients = (yield Promise.all(options.map(opt => setupClient(opt))).then(cl => cl.filter(c => !!c)));
        const status = yield Promise.all(clients.map(cli => uploadDir(cli, local, remote, ignore)));
        if (!status.every(s => !!s)) {
            core.error('Upload Error');
            core.setOutput('message', 'Upload Error');
            core.setFailed('Upload Error');
        }
        core.setOutput('message', 'Upload Success');
    });
}
run();
