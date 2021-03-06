var request = require('sync-request');
var contentType = require('content-type');

/**
 * Express-ssi init method
 * 
 * @param {Object} express
 * @param {String} ssiServer,default value:"http://www.atguat.com.cn"
 * @api public
 */
module.exports.init = function(express, ssiServer) {
    ssiServer = ssiServer || 'http://www.atguat.com.cn';

    var sendMethodRegExp = /function(\s*?)((send)*)(\s*?)\(body\)(\s*?)\{/g;
    var ssiMethod = 'body = replaceContentBySSITagParse(ssiServer, body);';

    //Override express-response send method and add ssi parse,generate new send method
    var newSendMethod = express.response.send.toString().replace(sendMethodRegExp, function(sendMethod) {
        return sendMethod + 'if(typeof(body) === "string"){' + ssiMethod + '}';
    });

    //Dynamic execution of the new send method
    eval('express.response.send = ' + newSendMethod);
};

/**
 * Replace body content by ssi tag parse
 *
 * @param {String} ssiDomain
 * @param {String} body
 * @api private
 */
function replaceContentBySSITagParse(ssiServer, body) {
    var ssiTagRegExp = /<!--[ ]*#([a-z]+)([ ]+([a-z]+)="(.+?)")*[ ]*-->/g;

    return body.replace(ssiTagRegExp, function(ssiTag) {
        var path = ssiTag.match(/"(.+?)"/gim)[0].replace(/"/g, '');
        var ssiResponse;

        try {
            ssiResponse = request('GET', ssiServer + path).getBody().toString();
        } catch (e) {
            console.log("错误:有一个ssi请求失败，可通过如下两步进行排查：");
            console.log("  (1)检查ssi标签有无语法错误：" + ssiTag);
            console.log("  (2)检查ssi请求能否正常访问：" + ssiServer + path);
            ssiResponse = ssiTag;
        }

        return ssiResponse;
    });
}

/**
 * Set the charset in a given Content-Type string.
 *
 * @param {String} type
 * @param {String} charset
 * @return {String}
 * @api private
 */
function setCharset(type, charset) {
    if (!type || !charset) {
        return type;
    }

    var parsed = contentType.parse(type);
    parsed.parameters.charset = charset;

    return contentType.format(parsed);
}
