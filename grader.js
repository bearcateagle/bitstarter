#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/
var rest = require('restler');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTML_URL_DEFAULT = "http://obscure-brook-7332.herokuapp.com/";
var HTMLFILE_downloaded = "downloaded_html.html";
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLExists = function(infile) { //does nothing
    var instr = infile.toString();

    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url <url_address>', 'URL to html', clone(assertURLExists), HTML_URL_DEFAULT)
        .parse(process.argv);
	
	var mode="url"; //mode is url or file, default is url
	process.argv.forEach(function (val, index, array) { //check each arg 
		if (val.indexOf('-f') !== -1) {	//if "-u" or "--url" specified, use url, otherwise use local file
			mode="file"
		}
	});
	// console.log("program.file: " + program.file);
	// console.log("program.url: " + program.url);
	// if (program.file){
		// mode="file";
	// }else {
		// mode="url";
	// }
	
    if(mode==="url"){ //url mode
		console.log("mode: url");
		console.log("Downloading from url: " + program.url);
		rest.get(program.url).on('complete', function(result) {
		console.log("rest.get() complete");
		if (result instanceof Error) {
			console.log('Error: ' + result.message);
			this.retry(5000); // try again after 5 sec
		} else {
			fs.writeFileSync(HTMLFILE_downloaded, result);
			console.log("fs.writeFileSync() complete");
			//console.log(result);

			//var checkJson = checkHtmlFile(program.file, program.checks);
			var checkJson = checkHtmlFile(HTMLFILE_downloaded, program.checks);
			console.log("checkHtmlFile() complete");
			var outJson = JSON.stringify(checkJson, null, 4);
			console.log(outJson);
		}
		});
	}else{ //file mode
		console.log("mode: file");
		console.log("Checking local file");
		//var checkJson = checkHtmlFile(program.file, program.checks);
		var checkJson = checkHtmlFile(program.file, program.checks);
		console.log("checkHtmlFile() complete");
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
		
	}

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
