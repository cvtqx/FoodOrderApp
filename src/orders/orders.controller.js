const path = require("path");


// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res){
    res.json({data: orders});
}

//validate that property exists

function bodyDataHas(propertyName){

    return function(req, res, next){
        const {data = {}} = req.body;
        if(data[propertyName]){
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`,
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
            message: `Order must include a ${propertyName}`,
        });
    };
}
//validate that dishes is array and is not empty

function dishesIsArray(req, res, next){
    const {data: {dishes} = {}} = req.body;
    if(Array.isArray(dishes) && dishes.length > 0){
        return next();
    }
    next({
        status: 400,
        message: "Order must include at least one dish"
    });
}

//TODO validate dish.quantity
function validateQuantity(req, res, next){

    const {data: {dishes} = {}} = req.body;

  dishes.forEach((dish, index) =>{
        if (
          !dish.quantity ||
          dish.quantity <= 0 ||
          !Number.isInteger(dish.quantity)
        ) {
          return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          });
        }  
});  
return next();  
}

//create order
function create(req, res){
    const {data: {deliverTo, mobileNumber, status, dishes} ={}} = req.body;

    const newOrder = {
      id: nextId(), 
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      status: status,
      dishes: dishes,
    };

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

//validate that order exists

function orderExists(req, res, next){
    const {orderId} = req.params;
    const foundOrder = orders.find(order => order.id == Number(orderId));
    if(foundOrder){
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
}

//get one order

function read(req, res,next){
    res.json({ data: res.locals.order});
}

//validate status of the order
function validateStatus(req, res,next){
    const {data: {status} = {}} = req.body;
    const validStatus = [
        "pending",
        "preparing",
        "out-for-delivery",
        "delivered",
    ];
    if(validStatus.includes(status)){
        return next();
    }
    next({
        status: 400,
        message: `Order must have a status of ${validStatus}`,
    });
}


function validateNewId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id && id != Number(orderId)) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

//update order
function update(req, res, next){
    const order = res.locals.order;
    const {data: {deliverTo, mobileNumber, status, dishes} = {}} = req.body;

    if (order.status === "delivered"){
        return next({
            status: 400,
            message: "A delivered order cannot be changed",
        })
    }else{
    //update the order
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({data: order});
    }
}

function orderPending(req, res, next){
    const order = res.locals.order;
    const {data: {status} = {}} = req.body;
    if (order.status === "pending") {
        return next();
    }
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
}

//delete order
function destroy(req, res){
    const {orderId} = req.params;
    const index = orders.findIndex(order => order.id  === Number(orderId));
    const deletedOrders = orders.splice(index, 1);

    res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    propertyIsNotEmpty("deliverTo"),
    propertyIsNotEmpty("mobileNumber"),
    dishesIsArray,
    validateQuantity,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    propertyIsNotEmpty("deliverTo"),
    propertyIsNotEmpty("mobileNumber"),
    dishesIsArray,
    validateQuantity,
    validateStatus,
    validateNewId,
    update,
  ],
  delete: [orderExists, orderPending, destroy],
};