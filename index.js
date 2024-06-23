const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT | 5000
let jwt = require('jsonwebtoken');
const stripe = require("stripe")('sk_test_51NgMf2SJZsIhUwm5TWFi9g4SrqXCK64lm6uRTaywDhymkuX5Umy9WaPjs5DqZwFSo6h8KMzLhXKBwRpzJKUfUpdF00wrja3qm3');

// middleWare
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
require('dotenv').config()
// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.60qibw3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const hotelsCollection = client.db('TravelTide').collection('hotels')
        const desCollection = client.db('TravelTide').collection('destinations')
        const cartCollection = client.db('TravelTide').collection('cart')

        // Verify Token
        const verifyToken = (req, res, next) => {
            if (!req?.headers?.authorization) {
                return res.status(401).send({ message: 'Forbidden access' })
            }
            const token = req?.headers?.authorization?.split(' ')[1]
            const verify = jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Forbidden access' })
                }
                req.decoded = decoded
                next()
            })
        }
        // VerIfy Admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()

        }
        // Get Hotels
        app.get('/hotels', async (req, res) => {
            try {
                const hotels = await hotelsCollection.find().toArray();
                res.send(hotels);
            } catch (err) {
                res.status(500).send({ message: 'Internal Server Error' });
            }
        });
        // Get All Cart By User
        app.get('/cart/:email', async (req, res) => {
            const { email } = req.params
            const query = { user: email }
            const results = await cartCollection.find(query).toArray()
            res.send(results)
        })
        app.delete('/cart/:id', async (req, res) => {
            try {
                const { id } = req.params;
                console.log(id);
                const query = { _id: new ObjectId(id) }
                const result = await cartCollection.deleteOne(query)
                console.log(result);
                res.send(result)

            } catch (err) {
                res.status(500).send({ message: 'Internal Server Error' });
            }
        });

        // Single Hotel Details
        app.get('/hotel/:uniqueId', async (req, res) => {
            try {
                const { uniqueId } = req.params
                const query = { uniqueId: uniqueId }
                const hotel = await hotelsCollection.findOne(query)
                res.send(hotel)
            } catch (err) {
                res.status(500).send({ message: 'Internal Server Error' });
            }
        });
        app.get('/destinations', async (req, res) => {
            try {
                const hotels = await desCollection.find().toArray();
                res.send(hotels);
            } catch (err) {
                res.status(500).send({ message: 'Internal Server Error' });
            }
        });
        // Cart Post 
        app.post('/cart', async (req, res) => {
            try {
                const newData = req.body; // Get the new data from the request body
                if (newData) {
                    // Check if the item already exists in the collection
                    const cartItem = await cartCollection.findOne({ _id: newData._id });
                    if (cartItem) {
                        res.status(400).send({ message: 'You have already added this item.' });
                    } else {
                        // Insert the new data into the collection
                        const postData = await cartCollection.insertOne(newData);
                        res.status(201).send(postData);
                    }
                } else {
                    res.status(400).send({ message: 'Invalid data received.' });
                }
            } catch (err) {
                res.status(500).send({ message: 'Internal Server Error' });
            }
        });

        // JWT
        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Travel Tide Is Waiting')
})
app.listen(port, console.log('Travel Tide Boss is running'))