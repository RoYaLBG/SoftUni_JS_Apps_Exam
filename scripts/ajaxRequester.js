'use strict';
var ajaxRequester = (function() {
    var baseUrl = "https://api.parse.com/1/";
    var headers =
    {
        "X-Parse-Application-Id": "",
        "X-Parse-REST-API-Key": ""
    };

    function login(username, password, success, error) {
        jQuery.ajax({
            method: "GET",
            headers: headers,
            url: baseUrl + "login",
            data: {username: username, password: password},
            success: success,
            error: error
        });
    }

    function register(username, password, success, error) {
        jQuery.ajax({
            method: "POST",
            headers: headers,
            url: baseUrl + "users",
            data: JSON.stringify({username: username, password: password}),
            success: success,
            error: error
        });
    }

    function getHeadersWithSessionToken(sessionToken) {
        var headersWithToken = JSON.parse(JSON.stringify(headers));
        headersWithToken['X-Parse-Session-Token'] = sessionToken;
        return headersWithToken;
    }

    function getProducts(sessionToken, success, error) {
        var headersWithToken = getHeadersWithSessionToken(sessionToken);
        jQuery.ajax({
            method: "GET",
            headers: headersWithToken,
            url: baseUrl + "classes/Product",
            success: success,
            error: error
        });
    }

    function createProduct(name, category, price, userId, success, error) {
        if (isNaN(Number(price)) || !price || !name || !category) {
            return error();
        }

        var product = {name: name.toHtmlEntities(), category: category.toHtmlEntities(), price: Number(price), ACL : {}};
        product.ACL[userId] = {"write": true, "read": true};
        product.ACL["*"] = {"read": true};

        jQuery.ajax({
            method: "POST",
            headers: headers,
            url: baseUrl + "classes/Product",
            data: JSON.stringify(product),
            success: success,
            error: error
        });
    }

    function editProduct(sessionToken, productId, name, category, price, success, error) {
        if (isNaN(Number(price)) || !price || !name || !category) {
            return error();
        }

        var product = {name: name.toHtmlEntities(), category: category.toHtmlEntities(), price: Number(price)};
        var headersWithToken = getHeadersWithSessionToken(sessionToken);
        jQuery.ajax({
            method: "PUT",
            headers: headersWithToken,
            url: baseUrl + "classes/Product/" + productId,
            data: JSON.stringify(product),
            success: success,
            error: error
        });
    }

    function deleteProduct(sessionToken, productId, success, error) {
        var headersWithToken = getHeadersWithSessionToken(sessionToken);
        jQuery.ajax({
            method: "DELETE",
            headers: headersWithToken,
            url: baseUrl + "classes/Product/" + productId,
            success: success,
            error: error
        });
    }

    return {
        login: login,
        register: register,
        getProducts: getProducts,
        createProduct: createProduct,
        editProduct: editProduct,
        deleteProduct: deleteProduct
    };
})();