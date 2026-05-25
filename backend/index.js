// This file acts as a proxy entry point for Hostinger/cPanel Node.js servers
// that expect a root-level index.js file. It redirects execution to the compiled dist/index.js.

require('./dist/index.js');
