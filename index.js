// require

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const jwtSecret =
  "ab7f5af9c9734a036b75258501a6aec81b3eb1aaa11bb2e27b3ca6a2d1a36c8dca2a58ba8d986757e98fe5b7507879ee749619cd00bb83a34037d70102ca48d1";
// Uses
const app = express();
const port = process.env.PORT || 5000;
const uri =
  "mongodb+srv://jahedahmed2:kZ68cOT0hDL6K2U9@cluster0.7bfhsu6.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// cors policy uses

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authoraization = req.headers.authorization;
  const token = authoraization.split(" ")[1];
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.send({ err: message });
    }
    res.decoded = decoded;
    next();
  });
};
// Route

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    await client.connect();
    const database = client.db("chef-blog").collection("all-data");
    const userdatabase = client.db("chef-blog").collection("user-data");
    const commentdatabase = client.db("chef-blog").collection("comment-data");

    app.post("/jwt", (req, res) => {
      const body = req.body;
      const token = jwt.sign(body, jwtSecret, { expiresIn: "1h" });
      res.send({ token });
    });

    app.get("/all-data", async (req, res) => {
      const result = await database.find().toArray();
      res.send(result);
    });

    app.get("/single-data/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await database.findOne(query);
      res.send(result);
    });

    // admin route check
    app.get("/user-data", async (req, res) => {
      const result = await userdatabase.find().toArray();
      res.send(result);
    });
    //add user to database
    app.post("/add-user", async (req, res) => {
      const body = req.body;
      const email = req.body.email;
      const exitUser = await userdatabase.findOne({ email: email });
      if (exitUser) {
        res.send("user already exited");
      }
      const result = await userdatabase.insertOne(body);
      res.send(result);
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userdatabase.findOne(query);
      if (user?.role !== "admin") {
        return res.send({ error: true, message: "not admin" });
      }
      next();
    };

    // admin check route
    app.get("/admin-data/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userdatabase.findOne(query);
      res.send({ admin: result?.role === "admin" });
    });

    // cooker check Route
    app.get("/cooker-data/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userdatabase.findOne(query);
      res.send({ cooker: result?.role === "cooker" });
    });

    // add item
    app.post("/add-item", async (req, res) => {
      const body = req.body;
      const result = await database.insertOne(body);
      res.send(result);
    });
    // item delete
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await database.deleteOne(query);
      res.send(result);
    });

    app.patch("/update/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const options = {
        upsert: true,
      };
      const updatedoc = {
        $set: {
          name: body.name,
          author: body.author,
          ingredients: body.ingredients,
          instructions: body.instructions,
          img: body.photourl,
        },
      };
      const result = await database.updateOne(query, updatedoc, options);
      res.send(result);
    });

    app.put("/apporved/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const updatedoc = {
        $set: { status: "approved" },
      };

      const options = {
        upsert: true,
      };
      const result = await database.updateOne(query, updatedoc, options);
      res.send(result);
    });
    // make admin
    app.put("/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedoc = { $set: { role: "admin" } };
      const options = {
        upsert: true,
      };
      const result = await userdatabase.updateOne(query, updatedoc, options);
      res.send(result);
    });

    app.put("/cooker/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedoc = { $set: { role: "cooker" } };
      const options = {
        upsert: true,
      };
      const result = await userdatabase.updateOne(query, updatedoc, options);
      res.send(result);
    });

    app.get("/commentData", async (req, res) => {
      const result = await commentdatabase.find().toArray();
      res.send(result);
    });
    app.post("/comment", async (req, res) => {
      const body = req.body;
      const result = await commentdatabase.insertOne(body);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome To Chef-Blog");
});
app.listen(port, () => {
  console.log(`Chef is running in ${port}`);
});
