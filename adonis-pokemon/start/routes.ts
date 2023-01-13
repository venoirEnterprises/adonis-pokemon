/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {

  Route.post("register", "SecurityController.register");
  Route.post("login", "SecurityController.login");

  Route.group(() => {
    Route.post("/add", "PokemonController.add");
    Route.get("/get/:id", "PokemonController.getById")
    Route.get("/getAll", "PokemonController.getAll")
    Route.get("/search", "PokemonController.search")
    Route.get("/release/:id", "PokemonController.releaseById")
    Route.put("rename/:id", "PokemonController.rename")
  }).middleware("auth")
}).prefix("rest")