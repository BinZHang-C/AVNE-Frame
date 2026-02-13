import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const compileTsModule = async (tsPath) => {
  const source = fs.readFileSync(tsPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: tsPath,
  }).outputText;

  const tmpPath = path.join('.tmp', path.basename(tsPath, '.ts') + '.mjs');
  fs.mkdirSync('.tmp', { recursive: true });
  fs.writeFileSync(tmpPath, transpiled, 'utf8');
  return import(path.resolve(tmpPath));
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
  const createModule = await compileTsModule('api/video-create.ts');
  const statusModule = await compileTsModule('api/video-status.ts');

  const createMissingPrompt = await invoke(createModule.default, { method: 'POST', body: {} });
  const createMissingKey = await invoke(createModule.default, { method: 'POST', body: { prompt: 'test prompt' } });
  const statusMissingOp = await invoke(statusModule.default, { method: 'POST', body: {} });

  console.log('video-create missing prompt =>', createMissingPrompt.statusCode, createMissingPrompt.body);
  console.log('video-create missing key =>', createMissingKey.statusCode, createMissingKey.body);
  console.log('video-status missing operation =>', statusMissingOp.statusCode, statusMissingOp.body);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
