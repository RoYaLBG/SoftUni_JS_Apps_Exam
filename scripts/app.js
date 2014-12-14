'use strict';
(function($) {

    String.prototype.toHtmlEntities = function() {
        return this.replace(/./gm, function(s) {
            return "&#" + s.charCodeAt(0) + ";";
        });
    };

    $(function () {
        registerEventHandlers();
        goToHome();
    });

    /**
     * Helper function which decodes html entities
     *
     * @param string {string}
     * @returns {string}
     */
    function fromHTMLEntities(string) {
        return (string+"").replace(/&#\d+;/gm,function(s) {
            return String.fromCharCode(s.match(/\d+/gm)[0]);
        })
    };


    function guestView() {
        template.header('guest', function() {
            template.main('guest', registerEventHandlers);
        });
    }

    function authView() {
        template.header('logged', function() {
            template.main('logged', function() {
                registerEventHandlers();
                var currentUser = userSession.getCurrentUser();
                $("#user").text(currentUser.username);
            });
        })
    }

    function registerEventHandlers() {
        $("#goToHome").click(goToHome);
        $("#goToLogin").click(goToLogin);
        $("#login").click(goToLogin);
        $('#goToRegister').click(goToRegister);
        $("#goToAdd").click(goToAdd);
        $("#goToProducts").click(showProducts);
        $("#logout").click(logout);
    }

    function goToHome() {
        var currentUser = userSession.getCurrentUser();
        if (currentUser) {
            authView();
        } else {
            guestView();
        }
    }

    function goToLogin() {
        template.main('login', function() {
            $("#login-button").click(loginClicked);
            $('.registerButton').click(goToRegister);
        });
    }

    function goToRegister() {
        template.main('register', function() {
            $("#register-button").click(registerClicked)
            $(".loginButton").click(goToLogin);
        });
    }

    function goToAdd() {
        template.main('products/add', function() {
            $("#add-product-button").click(addProduct);
            $("#cancel-product-button").click(showProducts);
        });
    }

    function addProduct() {
        var name = $("#name").val();
        var category = $("#category").val();
        var price = $("#price").val();
        var currentUser = userSession.getCurrentUser();
        ajaxRequester.createProduct(name, category, price, currentUser.objectId,
            function() {
                showInfoMessage("Add successful");
                showProducts();
            },
            function() {
                showErrorMessage("Product create failed.");
            }
        );
    }

    function showProducts() {
        var currentUser = userSession.getCurrentUser();
        var sessionToken = currentUser.sessionToken;

        template.main('products/list', function () {
            ajaxRequester.getProducts(sessionToken, function (data) {
                var el = $(".product").last();
                for (var i = 1; i < data.results.length; i++) {
                    $(el).parent().append($(el).clone())
                }

                var elements = $(".product");

                var categories = [];

                for (var i in data.results) {
                    var el = $(elements[i]);
                    el.find('.item-name').append(data.results[i].name);
                    el.find('.category').append(data.results[i].category);
                    el.find('.price').append(data.results[i].price);

                    if (data.results[i].ACL[currentUser.objectId]) {
                        el.find('.product-footer').show();
                        var $editButton = el.find('.edit-button');
                        var $deleteButton = el.find('.delete-button');
                        $editButton.attr('data-all', JSON.stringify(data.results[i]));
                        $deleteButton.attr('data-all', JSON.stringify(data.results[i]));


                        $editButton.click(function() {
                            editProduct(JSON.parse($(this).attr('data-all')), sessionToken);
                        });

                        $deleteButton.click(function() {
                            deleteProduct(JSON.parse($(this).attr('data-all')), sessionToken);
                        })
                    }

                    if ($.inArray(data.results[i].category, categories) === -1) {
                        categories.push(data.results[i].category);
                    }

                }

                for (var c in categories) {
                    var option = $("#category").find('option').last().clone();

                    var displayCategory = fromHTMLEntities(categories[c]);

                    $(option).val(categories[c]);
                    $(option).text(displayCategory);
                    $("#category").append($(option));
                }

                $("#filter").click(filterProducts);
                $("#clear-filters").click(clearFilters);
            },
            function() {
                showErrorMessage('Could not load products');
            }
            );
        });
    }

    function logout() {
        userSession.logout();
        showInfoMessage("Successfully logged out. Come back soon :)")
        goToHome();
    }

    function loginClicked() {
        var username = $("#username").val();
        var password = $("#password").val();
        ajaxRequester.login(username, password, authSuccess, loginError);
    }

    function registerClicked() {
        var username = $("#username").val();
        var password = $("#password").val();
        var confirm = $("#confirm-password").val();

        if (password != confirm) {
            registerError({
                responseJSON: {
                    error: "Passwords mismatch"
                }
            });
            return;
        }

        ajaxRequester.register(username, password,
            function(data) {
                data.username = username;
                authSuccess(data);
            },
            registerError);
    }

    /**
     *
     * @param product object {name, category, price}
     * @param sessionToken {string}
     */
    function editProduct(product, sessionToken) {
        template.main('products/edit', function() {
            $("#item-name").val(fromHTMLEntities(product.name));
            $("#category").val(fromHTMLEntities(product['category']));
            $("#price").val(fromHTMLEntities(product.price));

            $("#cancel-product-button").click(showProducts);

            $("#edit-product-button").click(function() {
                ajaxRequester.editProduct(
                    sessionToken,
                    product.objectId,
                    $("#item-name").val(),
                    $("#category").val(),
                    $("#price").val(),
                    function() {
                        showInfoMessage("Product edited successfully");
                        showProducts();
                    },
                    function() {
                        showErrorMessage("An error occured while editing a product");
                    }
                )
            });
        })
    }

    /**
     *
     * @param product object {name, category, price}
     * @param sessionToken {string}
     */
    function deleteProduct(product, sessionToken) {
        template.main('products/delete', function() {
            $("#item-name").val(fromHTMLEntities(product.name));
            $("#category").val(fromHTMLEntities(product['category']));
            $("#price").val(fromHTMLEntities(product.price));

            $("#cancel-product-button").click(showProducts);

            $("#delete-product-button").click(function() {
                ajaxRequester.deleteProduct(
                    sessionToken,
                    product.objectId,
                    function () {
                        showInfoMessage('Deleted successfully')
                        showProducts();
                    },
                    function () {
                        showErrorMessage('An error occured while deleting a product')
                    }
                )
            });
        });
    }

    function filterProducts() {
        var cat = $("#category").val();

        cat = (cat+"").replace(/&#\d+;/gm,function(s) {
            return String.fromCharCode(s.match(/\d+/gm)[0]);
        });

        var keyword = $("#search-bar").val();
        var minPrice = Number($("#min-price").val());
        var maxPrice = Number($("#max-price").val());
        $('.product').each(function() {
           var productPrice = Number($(this).find('.price').text().replace(/[^0-9.]/gi, ''));
           if (
               ($(this).find('.category').text() != "Category:" + cat && cat != "All")
                || ($(this).find('.item-name').text().indexOf(keyword) == -1)
                || (productPrice < minPrice || productPrice > maxPrice)
           ) {
               $(this).hide();
           } else {
               $(this).show();
           }
        });
    }

    function clearFilters() {
        $("input").each(function() {
            $(this).val($(this).attr('value'));
        });

        $("#category").val($($('#category').find('option')[0]).val());

        $("#filter").click();
    }

    function authSuccess(data) {
        userSession.login(data);
        showInfoMessage('Login successful');
        goToHome();
    }

    /**
     *
     * @param error {string}
     */
    function loginError(error) {
        showAjaxError("Login failed", error);
    }

    /**
     *
     * @param error {string}
     */
    function registerError(error) {
        showAjaxError("Register failed", error);
    }

    /**
     *
     * @param msg {string}
     * @param error object {responseJson: {errMsg}}
     */
    function showAjaxError(msg, error) {
        var errMsg = error.responseJSON;
        if (errMsg && errMsg.error) {
            showErrorMessage(msg + ": " + errMsg.error);
        } else {
            showErrorMessage(msg + ".");
        }
    }

    /**
     *
     * @param msg {string}
     */
    function showInfoMessage(msg) {
        noty({
                text: msg,
                type: 'info',
                layout: 'topCenter',
                timeout: 2000}
        );
    }

    /**
     *
     * @param msg {string}
     */
    function showErrorMessage(msg) {
        noty({
                text: msg,
                type: 'error',
                layout: 'topCenter',
                timeout: 5000}
        );
    }

})(jQuery);