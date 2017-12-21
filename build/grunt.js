module.exports = function(grunt) {
	require('time-grunt')(grunt);	
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		clean: {
      		build: ['build/temp/*', 'es5'],
      		dist: ['dist/*']
    	},
    	shell: {      
      		rollupall: {
		        command: 'npm run rollup -- --no-progress && npm run rollup-minify -- --no-progress',
		        options: {
		          preferLocal: true
		        }
		    }
		}
	});

	grunt.registerTask('build', [
	    'clean:build',
	    'shell:rollupall'
  ]);
};