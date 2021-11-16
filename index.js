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



        // app products post
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
        })
        // get limited products
        app.get('/limitProducts', async(req, res) => {
            const cursor = productsCollection.find({}).limit(6);
            const products = await cursor.toArray();
            res.send(products);
        })


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