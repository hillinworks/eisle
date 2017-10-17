var shell = require('shelljs');

shell.cp('-R', 'public', 'dist/public');
shell.cp('-R', 'views', 'dist/views');