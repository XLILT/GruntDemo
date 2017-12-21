import { rollup } from 'rollup';
import watch from 'rollup-watch';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import uglify from 'rollup-plugin-uglify';
import minimist from 'minimist';
import _ from 'lodash';
import pkg from '../package.json';
import fs from 'fs';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify', 'progress'],
  default: {
    progress: true
  },
  alias: {
    w: 'watch',
    m: 'minify',
    p: 'progress'
  }
});

if (args.watch) {
  args.progress = false;
}

const primedResolve = resolve({
  jsnext: true,
  main: true,
  browser: true
});

const primedCjs = commonjs({
  sourcemap: false
});

const primedBabel = babel({
  babelrc: false,
  exclude: 'node_modules/**',
  presets: [
    'es3',
    ['env', {
      loose: true,
      modules: false
    }]
  ],
  plugins: ['external-helpers']
});

const es = {
  options: {
    input: 'src/main.js',
    plugins: [
      json(),
      primedBabel,
      args.progress ? progress() : {},
      filesize()
    ],
    onwarn(warning) {
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
          warning.code === 'UNRESOLVED_IMPORT') {
        return;
      }

      // eslint-disable-next-line no-console
      console.warn(warning.message);
    },
    legacy: true,
    output: {
      strict: false,
      format: 'es',
      file: 'dist/main.es.js'
    }
  }  
};

const cjs = Object.assign({}, es, {  
    outions: {
      output: {
        format: 'cjs',  
        file: 'dist/main.cjs.js'  
      }      
    }
    
});

const umd = {
  options: {
    input: 'src/main.js',
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      args.progress ? progress() : {},
      filesize()
    ],
    legacy: true,    
    output: {
      name: 'main_module',
      strict: false,
      format: 'umd',  
      file: 'dist/main.js'    
    }  
  } 
  
};

let minifiedUmd = Object.assign({}, _.cloneDeep(umd));
minifiedUmd.options.output.file = 'dist/main.min.js';


minifiedUmd.options.plugins.splice(4, 0, uglify({
  //preserveComments: 'some',
  //screwIE8: false,
  mangle: true,
  compress: {
    /* eslint-disable camelcase */
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: true
    /* eslint-enable camelcase */
  }
}));

function runRollup({options, strict, format, dest, banner}) {
  //console.log(options);
  //return;
  rollup(options)
  .then(function(bundle) {
    bundle.write(options.output);
  }, function(err) {
    // eslint-disable-next-line no-console
    console.error(err);
  });
}

if (!args.watch) {
  if (args.minify) {
    runRollup(minifiedUmd);    
  } else {
    runRollup(es);
    runRollup(cjs);
    runRollup(umd);    
  }
} else {
  const props = ['format', 'dest', 'banner', 'strict'];
  const watchers = [
    ['es', watch({rollup},
                 Object.assign({},
                               es.options,
                               _.pick(es, props)))],
    ['cjs', watch({rollup},
                  Object.assign({},
                                cjs.options,
                                _.pick(cjs, props)))],
    ['umd', watch({rollup},
                  Object.assign({name: 'videojs'},
                                umd.options,
                                _.pick(umd, props)))]    
  ];

  watchers.forEach(function([type, watcher]) {
    watcher.on('event', (details) => {
      if (details.code === 'BUILD_START') {
        // eslint-disable-next-line no-console
        console.log(`Bundling ${type}...`);
        return;
      }

      if (details.code === 'BUILD_END') {
        // eslint-disable-next-line no-console
        console.log(`Bundled ${type} in %s`, duration(details.duration));
        return;
      }

      if (details.code === 'ERROR') {
        // eslint-disable-next-line no-console
        console.error(details.error.toString());
        return;
      }
    });
  });
}