<?php

/** @var \Laravel\Lumen\Routing\Router $router */

$router->get('/', function () use ($router) {
    return $router->app->version();
});

$router->get('/api/test', 'TestController@show');

$router->post('/api/login', 'AuthController@login');

$router->group(['middleware' => 'admin.auth'], function () use ($router) {
    $router->post('/api/logout', 'AuthController@logout');
    $router->post('/api/change-password', 'AuthController@changePassword');

    $router->get('/api/dashboard', 'DashboardController@summary');
    $router->get('/api/reports', 'ReportController@summary');
    $router->get('/api/schedule', 'ScheduleController@index');

    $router->get('/api/customers', 'CustomerController@index');
    $router->get('/api/customers/{id}', 'CustomerController@show');
    $router->put('/api/customers/{id}', 'CustomerController@update');

    $router->get('/api/menu-items', 'MenuItemController@index');
    $router->post('/api/menu-items', 'MenuItemController@store');
    $router->put('/api/menu-items/{id}', 'MenuItemController@update');
    $router->delete('/api/menu-items/{id}', 'MenuItemController@destroy');

    $router->get('/api/orders', 'OrderController@index');
    $router->post('/api/orders', 'OrderController@store');
    $router->put('/api/orders/{id}/status', 'OrderController@updateStatus');
    $router->delete('/api/orders/{id}', 'OrderController@destroy');

    $router->get('/api/orders/{id}/payments', 'PaymentController@index');
    $router->post('/api/orders/{id}/payments', 'PaymentController@store');
});
