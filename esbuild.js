const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  // vscode is provided at runtime by VS Code itself — never bundle it
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  outfile: 'dist/extension.js',
  sourcemap: true,
  minify: production,
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Build complete.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
