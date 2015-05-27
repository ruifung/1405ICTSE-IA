/*
 * This file is part of the custom-scroller for Polymer package.
 *
 * (c) François Pluchino <francois.pluchino@sonatra.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/*  global module */
/*  global grunt */

'use strict';

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      options: {
        nospawn: true
      },
      default: {
        files: [
          '/*.html',
          '/*.css'
        ]
      }
    },
    browserSync: {
      options: {
        notify: false,
        port: 9000,
        open: true,
        startPath: "/custom-scroller"
      },
      seed: {
        options: {
          watchTask: true,
          injectChanges: false, // can't inject Shadow DOM
          server: {
            baseDir: ['./../']
          }
        },
        bsFiles: {
          src: [
            './**/*.{css,html,js}'
          ]
        }
      }
    }
  });

  grunt.registerTask('serve', function () {
    grunt.task.run([
      'browserSync:seed',
      'watch'
    ]);
  });

  grunt.registerTask('default', [
    'serve'
  ]);
};
