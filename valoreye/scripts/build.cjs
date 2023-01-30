const { execSync, fork } = require('child_process'),
  packageJson = require('../package.json'),
  esbuild = require('esbuild'),
  { join } = require('path')

const ROOT_PATH = join(__dirname, '..'),
  DIST_PATH = join(ROOT_PATH, 'dist'),
  SRC_PATH = join(ROOT_PATH, 'src')

const args = process.argv.slice(2)

// should be 'production' | 'development'
const env = args.some((a) => a.match(/^(?:--production)$/gi) !== null)
  ? 'production'
  : 'development'

// --watch or -w
const watch =
  args.length > 0 && args.some((a) => a.match(/^(?:--watch|-w)$/gi) !== null)
if (watch) process.stdout.write('[watch] ')

const production = env === 'production'

const defines = {
  BUILD_META: JSON.stringify({
    version: packageJson.version,
    commit: execSync('git rev-parse HEAD').toString().trim(),
    buildDate: new Date().toLocaleString(),
    env: env,
  }),
  'process.env.NODE_ENV': JSON.stringify(env),
}

esbuild.build({
  entryPoints: [join(SRC_PATH, 'index.ts')],

  watch: watch,

  bundle: true,
  outdir: DIST_PATH,
  sourcemap: !production,
  minify: production,

  platform: 'node',
  format: 'cjs',

  legalComments: 'inline',

  loader: { '.asar': 'binary' },

  // create shaded bundle for releases
  external: [
    ...(production
      ? []
      : Object.keys({
          ...require('../package.json').dependencies,
          ...require('../package.json').devDependencies,
        }).filter((i) => i !== 'shared')),
    'readline/promises',
  ],
  define: defines,

  logLevel: 'info',
  logLimit: process.env.CI ? 0 : 30,
})
