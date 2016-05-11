/**
 * Created by asistent on 10.05.2016.
 */

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cheerio = require('cheerio');
var request = require('request');
var template = require('consolidate').jade;
var express = require('express');

var app = express();
var PORT = 8000;

app.engine('jade', template);

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.get('/', function (request, response){
    response.render('index', {
        title: 'Получение статей',
        url: request.cookies.url != undefined ? request.cookies.url : 'http://Habrahabr.ru',
        num: request.cookies.num != undefined ? request.cookies.num : 5
    });
});

app.post('/ajax', function (request, response){
    getContent({url: request.body.url, num: request.body.num}, function (data) {
        response.cookie('num', request.body.num);
        response.cookie('url', request.body.url);
        response.json(data);
    });
});

function getContent(req, callback) {
    request.get(req.url, function(err, res, html) {
        var data = [];
        var result = {};
        if (res.statusCode != 200) {
            result = {'status': 'error'};
        } else {
            var $ = cheerio.load(html);
            var div = $('#layout .inner .content_left .posts_list .post');
            div.each(function (i, element) {
                if (i > req.num - 1) {
                    return;
                }
                $(element).find($('a')).attr('target','_blank');
                $(element).find($('img')).removeAttr('height').removeAttr('width');
                var _title = $(element).find('.title').html();
                var content = $(element).find('.html_format').html();
                data.push({title: _title, content: content})
            });
            result = {'status': 'success', 'data': data};
        }
        callback(result);
    })
}

app.listen(PORT, function () {
    console.log('Server is launched on: http://localhost:' + PORT)
});