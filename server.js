const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const register = require("./models/register");
const products = require("./models/products");
const cartItems = require("./models/cartitems");
const crypto = require("crypto");
const userComment = require("./models/comments");
const yourOrderedItem = require("./models/your-orders");
const app = express();
app.use(
  cors({
    origin: [ "https://checkout.stripe.com"],
    credentials: true,
  })
);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/register", async (req, res) => {
  const { name, email, gender, pass } = req.body;
  const password = await bcrypt.hash(pass, 10);
  const regData = new register({
    name: name,
    email: email,
    pass: password,
    gender: gender,
  });
  try {
    const regDataDB = await regData.save();
    res.json("Successfully Registered");
  } catch (e) {
    console.log("error sending to mongo");
  }
});

app.post("/login", async (req, res) => {
  const { email, pass } = req.body;
  const userLog = await register.findOne({ email: email });

  if (userLog) {
    try {
      const isLogUser = await bcrypt.compare(pass, userLog.pass);
      if (isLogUser) {
        const token = jwt.sign(userLog.toJSON(), process.env.SECRET_KEY);
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 25892000000),
          httpOnly: true,
        });
        res.json({ token: token, message: "logsuccess" });
      } else {
        res.json({ message: "wrong credentials" });
      }
    } catch (error) {
      console.log("Error comparing passwords:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.json({ message: "user not registered" });
  }
});

app.post("/admin", async (req, res) => {
  console.log("admin");
});

app.get("/product", async (req, res) => {
  try {
    const allProducts = await products.find({});
    res.json(allProducts);
  } catch (e) {
    console.log("Product fetch error:", e);
    res.status(500).json({ error: "Error fetching product data" });
  }
});

app.get("/product/:itemId", async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const item = await products.findOne({ _id: itemId });

    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  } catch (e) {
    console.log("Error fetching item:", e);
    res.status(500).json({ error: "Error fetching item" });
  }
});

app.post("/addToCart", verifyUser, async (req, res) => {
  try {
    const user = req.user;
    const cart = await cartItems.findOne({ userId: user._id });

    if (cart) {
      const existingCartItem = cart.cartItems.find(
        (item) => item.itemId === req.body.itemId
      );

      if (existingCartItem) {
        existingCartItem.quantity += req.body.quantity;
      } else {
        cart.cartItems.push({
          itemId: req.body.itemId,
          quantity: req.body.quantity,
        });
      }

      await cart.save();
    } else {
      const newCart = new cartItems({
        userId: user._id,
        cartItems: [{ itemId: req.body.itemId, quantity: req.body.quantity }],
      });
      await newCart.save();
    }
    res.json({ message: "Added to cart successfully" });
  } catch (e) {
    console.log("Error sending to database");
    res.status(500).json({ error: "Error sending data" });
  }
});

app.post("/number-of-items", verifyUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "unauthorise" });
    } else {
      const user = req.user;
      const userMatch = await cartItems.find({ userId: user._id });

      const noOfItems = userMatch[0]?.cartItems?.length || 0;
      res.json({ value: noOfItems, message: "Successfully updated" });
    }
  } catch (e) {
    console.error("Error fetching cart items:", e);
    res.status(500).json("Can't update cart value");
  }
});

app.post("/fetch-cart-items", verifyUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "unauthorised" });
    } else {
      const user = req.user;
      const userMatch = await cartItems.find({ userId: user._id });
      res.json({ userMatch, user });
    }
  } catch (e) {
    console.log("Error loading cart items");
  }
});

app.use(express.json());

app.post("/quantity-update", verifyUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, newQuantity } = req.body;
    const cartItem = await cartItems.findOne({
      userId: userId,
      "cartItems.itemId": itemId,
    });
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    cartItem.cartItems.find((item) => item.itemId === itemId).quantity =
      newQuantity;
    await cartItem.save();
    res.json({ message: "Quantity updated successfully" });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ message: "Error updating quantity" });
  }
});

app.delete("/cart-item-delete/:itemId", verifyUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id;
    const itemId = req.params.itemId;

    const cart = await cartItems.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "User cart not found" });
    }

    const cartItemIndex = cart.cartItems.findIndex(
      (item) => item.itemId === itemId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.cartItems.splice(cartItemIndex, 1);

    await cart.save();

    res.json({ message: "Item removed from cart successfully" });
  } catch (e) {
    console.error("Error removing item from cart:", e);
    res.status(500).json({ error: "Error removing item from cart" });
  }
});

app.post("/add-comment", verifyUser, async (req, res) => {
  const userId = req.user._id;
  const { itemId, comment, rating } = req.body;
  const user = await register.findOne({ _id: userId });
  try {
    if (user) {
      userName = user.name;
      const newComment = new userComment({
        userId,
        rating: rating,
        user: userName,
        productId: itemId,
        comment: comment,
      });
      const regNewComment = await newComment.save();
      res.json("Comment Added Successfully");
    }
  } catch (error) {
    res.json("Adding comment failed");
  }
});

app.post("/fetchComments", async (req, res) => {
  const { itemId } = req.body;
  try {
    const comment = await userComment.find({ productId: itemId });
    if (comment) {
      res.json(comment);
    } else {
      res.json("Comments not found");
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching comments" });
  }
});

app.post("/create-price", verifyUser, async (req, res) => {
  const { billing } = req.body;
  try {
    const price = await stripe.prices.create({
      unit_amount: billing * 100,
      currency: "inr",
      product_data: {
        name: "Trez",
      },
    });

    res.json({ priceId: price.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating Price", error });
  }
});

app.post("/payment", verifyUser, async (req, res) => {
  const { priceId, currency, id, quantity } = req.body;
  console.log(id, quantity);
  try {
    const orderId = generateRandomOrderId(10);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
          currency,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/account/your-orders/success/${orderId}/${id}/${quantity}`,
      cancel_url: `http://localhost:3000/account/your-orders/failed/${orderId}`,
    });
    res.json({ sessionUrl: session.url });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error creating checkout session", error });
  }
});

app.post("/set-address", verifyUser, async (req, res) => {
  const { address } = req.body;
  const userId = req.user._id;

  try {
    await register.findOneAndUpdate(
      { _id: userId },
      { $set: { address: address } }
    );

    res.json("Address set successfully");
  } catch (error) {
    console.log("Error setting address:", error);
    res.status(500).json("Error setting address");
  }
});

app.post("/get-user-info", verifyUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await register.findOne({ _id: userId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.log("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/set-ordered-item", verifyUser, async (req, res) => {
  const userId = req.user._id;
  const { id, orderId, quantity } = req.body;
  const productId = id;
  const regOrders = new yourOrderedItem({
    userId,
    productId,
    orderId,
    quantity,
  });
  try {
    const saveOrder = await regOrders.save();
    res.status(200).json("Successfully saved order");
  } catch (error) {
    console.log("Error saving order");
  }
});

app.post("/get-ordered-items", verifyUser, async (req, res) => {
  const { quantity } = req.body;
  const userId = req.user._id;

  try {
    const userOrders = await yourOrderedItem.find({ userId: userId });

    if (userOrders.length > 0) {
      const orderedProducts = await Promise.all(userOrders.map(async (order) => {
        const product = await products.findOne({ _id: order.productId });
        return {
          ...product.toObject(),
          quantity: order.quantity,
          orderStatus: order.orderStatus // Include orderStatus in the response
        };
      }));
      
      res.status(200).json(orderedProducts);
    } else {
      res.status(404).json({ error: "No orders found for the user" });
    }
  } catch (error) {
    console.error("Error finding order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/fetch-comments', verifyUser, async (req, res) => {
  const userId = req.user._id;
  try {
    const comments = await userComment.find({ userId: userId });

    if (comments.length > 0) {
      const commentDetails = [];

      for (const comment of comments) {
        const productDetail = await products.findOne({ _id: comment.productId });
        if (productDetail) {
          commentDetails.push({
            comment: comment,
            productDetail: productDetail
          });
        }
      }

      if (commentDetails.length > 0) {
        res.json(commentDetails);
      } else {
        res.json({ error: "No product details found for the comments" });
      }
    } else {
      res.json({ error: "nocomment", message: "No comments found"});
    }
  } catch (error) {
    console.log("Error Occurred:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/update-password",verifyUser, async (req, res) => {
  const userId= req.user._id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await register.findOne({ _id: userId });
    console.log(user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.pass);
    console.log(user.pass);
    console.log(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.pass = hashedNewPassword;
    await user.save();

    res.json("Password updated successfully" );
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/fetch-user', verifyUser, async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await register.find({ _id: userId });
    if (user.length > 0) {
      res.json(user);
    } else {
      res.json("User Not Found");
    }
  } catch (error) {
    console.log("Error occurred");
    res.status(500).json({ error: "Internal Server Error" });
  }
});


function generateRandomOrderId(length) {
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  return buffer.toString("hex").slice(0, length);
}
function verifyUser(req, res, next) {
  const bearerHeader = req.headers["authorization"];

  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        res.status(401).json({ error: "Token verification failed" });
      } else {
        currentUser = user;
        req.user = user;
        next();
      }
    });
  } else {
    res.status(401).json({ error: "Authorization header missing" });
  }
}

app.listen(3001);
