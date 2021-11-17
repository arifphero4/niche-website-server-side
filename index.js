const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient } = require('mongodb');
const port= process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mp2nv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run () {
    try {
        await client.connect()
        const database = client.db('camera_product');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');



        // add products post
        app.post('/products', async (req, res) => {
            const product =req.body;
            console.log('hit the post api', product);
            

            const result = await productsCollection.insertOne(product);
            console.log(result);
            res.json(result)
        });


        // get all products
        app.get('/addToProducts', async(req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });
        // get limited products
        app.get('/limitProducts', async(req, res) => {
            const cursor = productsCollection.find({}).limit(6);
            const products = await cursor.toArray();
            res.send(products);
        });

        //check admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if(user?.role === 'admin'){
                isAdmin = true;
            }
            res.json({admin: isAdmin});
        })

        //add users data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        //put google sign in
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = {email: user.email};
            const options = {upsert: true};
            const updateDoc = {$set: user};
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        //make admin
        app.put('/users/admin', async(req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = {email: user.email};
            const updateDoc = { $set: { role: 'admin'} };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);

app.get('/',(req, res) => {
    res.send('Hello world');
});

app.listen(port, () => {
    console.log('Running Server on Port', port);
});