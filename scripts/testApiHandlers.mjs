import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const transpileToTmp = (inputPath, outputPath) => {
  const source = fs.readFileSync(inputPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: inputPath,
  }).outputText;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, transpiled, 'utf8');
};

const prepareModules = async () => {
  const tmpRoot = '.tmp';
  transpileToTmp('server/videoApi.ts', path.join(tmpRoot, 'server/videoApi.mjs'));

  let createSource = fs.readFileSync('api/video-create.ts', 'utf8');
  createSource = createSource.replace("'../server/videoApi'", "'../server/videoApi.mjs'");
  fs.mkdirSync(path.join(tmpRoot, 'api'), { recursive: true });
  fs.writeFileSync(path.join(tmpRoot, 'api/video-create.ts'), createSource, 'utf8');
  transpileToTmp(path.join(tmpRoot, 'api/video-create.ts'), path.join(tmpRoot, 'api/video-create.mjs'));

  let statusSource = fs.readFileSync('api/video-status.ts', 'utf8');
  statusSource = statusSource.replace("'../server/videoApi'", "'../server/videoApi.mjs'");
  fs.writeFileSync(path.join(tmpRoot, 'api/video-status.ts'), statusSource, 'utf8');
  transpileToTmp(path.join(tmpRoot, 'api/video-status.ts'), path.join(tmpRoot, 'api/video-status.mjs'));

  const createModule = await import(path.resolve(path.join(tmpRoot, 'api/video-create.mjs')));
  const statusModule = await import(path.resolve(path.join(tmpRoot, 'api/video-status.mjs')));
  return { createHandler: createModule.default, statusHandler: statusModule.default };
};

const invoke = async (handler, req) => {
  const result = { statusCode: 200, body: null };
  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(payload) {
      result.body = payload;
      return payload;
    },
  };
  await handler(req, res);
  return result;
};

const main = async () => {
  const { createHandler, statusHandler } = await prepareModules();

  const createMissingPrompt = await invoke(createHandler, { method: 'POST', body: {} });
  const createMissingKey = await invoke(createHandler, { method: 'POST', body: { prompt: 'test prompt' } });
  const statusMissingOp = await invoke(statusHandler, { method: 'POST', body: {} });

  console.log('video-create missing prompt =>', createMissingPrompt.statusCode, createMissingPrompt.body);
  console.log('video-create missing key =>', createMissingKey.statusCode, createMissingKey.body);
  console.log('video-status missing operation =>', statusMissingOp.statusCode, statusMissingOp.body);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
