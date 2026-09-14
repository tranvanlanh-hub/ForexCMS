// Resolves Next.js 16 + Turbopack externalized @prisma/client-<hash> requests
// to the real @prisma/client package. Loaded via `node --require` before
// `next start` so the runtime can find Prisma Client under both names.
const Module = require("node:module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (typeof request === "string" && /^@prisma\/client-[a-f0-9]+$/.test(request)) {
    return originalResolve.call(this, "@prisma/client", parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};
