const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
};
app.use(cors(corsConfig));
// app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  console.log(`New Car Doctor is Running on port: ${port}`);
  res.send(`Final Cors config,  server is running on port: ${port}`);
});

////MongoDB Start
const DB_USER = process.env.USER;
const DB_PASSWORD = process.env.PASSWORD;

// const uri = "mongodb+srv://<username>:<password>@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.jokwhaf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    ////Operation Start
    const serviceCollection = client.db("carsDoctor").collection("services");
    const bookingCollection = client.db("carsDoctor").collection("booking");

    //JWT
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECREET, {
        expiresIn: "1h",
      });
      res.send(token);
    });

    ///Get Single Data from services Start
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("Now ID: ",id);
      const query = { _id: new ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });
    ///Get Single Data from services End

    ////Post Booking Start
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      console.log(booking);

      const result = await bookingCollection.insertOne(booking);

      res.send(result);
    });
    ////Post Booking End

    ///Get Booking start
    // app.get('/booking',async(req,res)=>{
    //     const result=await bookingCollection.find().toArray()
    //     res.send(result)
    // })
    ///Get Booking end

    ///Get All Data from services Start
    app.get("/services", async (req, res) => {
      try {
        const sort = req.query.sort || "asc"; // Default sort order is ascending
        let search = req.query.search || ""; // Default search is an empty string

        // Ensure that search is a string
        search = String(search);

        console.log("Sort:", sort);
        console.log("Search:", search);

        const query = {
          title: { $regex: search, $options: "i" }, // Case-insensitive search
        };

        const options = {
          sort: {
            price: sort === "asc" ? 1 : -1, // Sort based on the provided order
          },
        };

        const result = await serviceCollection.find(query, options).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error occurred:", error);
        res
          .status(500)
          .send({ message: "An error occurred on the server.", error });
      }
    });
    ///Get All Data from services End

    ///Get Booking from spacific mail start
    app.get("/booking", async (req, res) => {
      let query = {};
      let sort = req?.query?.sort;
      console.log("Sort: ", sort);

      if (req.query.email) {
        query = { email: req.query.email };
        console.log("QueryMail: ", query);
      }
      if (sort == "true") {
        console.log("Come in true");
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
      }
      if (sort == "false") {
        console.log("Come in false");
        const result = await bookingCollection
          .find(query)
          .sort({ status: -1 })
          .toArray();
        res.send(result);
      }

      ///Get Booking from spacific mail End

      ///Delete Booking Start
      app.delete("/booking/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);
        res.send(result);
      });
      ///Delete Booking End

      ///Patch Booking Start
      app.patch("/booking/:id", async (req, res) => {
        const id = req.params.id;
        const booking = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateBooking = {
          $set: {
            ...booking,
          },
        };
        const result = await bookingCollection.updateOne(filter, updateBooking);

        res.send(result);
      });
      ///Patch Booking End
    });

    ////Operation End
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

////MongoDB End

app.listen(port, () => {
  console.log(`New Card Doctor: ${port}`);
});
