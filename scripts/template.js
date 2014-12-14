var template = (function($) {

    var TEMPLATES_FOLDER = 'templates/';
    var HEADERS_FOLDER = TEMPLATES_FOLDER + 'header/';

    function main(template, callback) {
        $("#main").load(TEMPLATES_FOLDER + template + '.html', callback);
    }

    function header(template, callback) {
        $("#menu").load(HEADERS_FOLDER + template + '.html', callback);
    }

    return {
        main: main,
        header: header
    }

}(jQuery));

