const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//displays a list of all dishes
function list(req, res){
    res.json({data: dishes})
}

//validate that object properties exist
function bodyDataHas(propertyName){
    return function(req, res, next){
        const {data ={}} = req.body;
        if(data[propertyName]){
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`,
        });
    };
}

//validate that  property is not empty
function propertyIsNotEmpty(propertyName){
    return function(req, res, next){
        const {data = {}} = req.body;
        if(data[propertyName].length >= 1){
                return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`,
        });
    };
}

//validate price property
function priceIsValidNumber(req, res, next){
    const {data: {price} = {}} = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
          status: 400,
          message: "Dish must have a price that is an integer greater than 0",
        });
    }
    next();
}

//creates and saves a dish

function create(req, res){
    const { data: { name, description, price, image_url} ={}} = req.body;
    const newDish ={
        id: nextId(), 
        name: name,
        description: description,
        price: price,
        image_url: image_url
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

//find dish by id 
function dishExists(req, res, next){
    const {dishId} = req.params;

    const foundDish = dishes.find(dish => dish.id === dishId);
    if(foundDish){
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`,
    });
}

function read(req, res, next){
    res.json({data: res.locals.dish});
}
// Validate if id in the body does not match :dishId in the route
function validateNewId(req, res, next){
    const {dishId} = req.params;
    const {data: {id} = {}} = req.body;

    if(id && id !== dishId){
        return next({
                    status: 400,
                    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
                    });
}
next();
}


function update(req, res){
    const dish = res.locals.dish;
    const {data: {name, description, price, image_url} ={}} = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({data: dish});
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    propertyIsNotEmpty("name"),
    propertyIsNotEmpty("description"),
    propertyIsNotEmpty("image_url"),
    priceIsValidNumber,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    propertyIsNotEmpty("name"),
    propertyIsNotEmpty("description"),
    propertyIsNotEmpty("image_url"),
    priceIsValidNumber,
    validateNewId,
    update,
  ],
};