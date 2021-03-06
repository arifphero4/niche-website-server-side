const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const ObjectId= require('mongodb').ObjectId;
const admin = require("firebase-admin");
const { MongoClient } = require('mongodb');
const port= process.env.PORT || 5000;





const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mp2nv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken (req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')){
        const token = req.headers.authorization.split(' ')[1];

        try{
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch{

        }
    }
    next();
}

async function run () {
    try {
        await client.connect()
        const database = client.db('camera_product');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');
        const reviewCollection = database.collection('review');



        // add products post
        app.post('/products', async (req, res) => {
            const product =req.body;
            console.log('hit the post api', product);
            

            const result = await productsCollection.insertOne(product);
            console.log(result);
            res.json(result)
        });

        // post product Order
        app.post('/orders', async(req, res) => {
            const product = req.body;
            const result= await ordersCollection.insertOne(product)
            res.json(result);
        });

        // get product order
        app.get('/orders', async(req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        })
        
        //post user review
        app.post('/userReview', async(req, res) =>{
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            console.log(result);
            res.send(result);
        })

        // get add review
        app.get('/infoReview', async(req, res) =>{
            const result = await reviewCollection.find({}).toArray();
            res.send(result);
        })

        //delete orders
        app.delete('/orders/:id',async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        });
        //delete products
        app.delete('/addToProducts/:id',async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productsCollection.deleteOne(query);
            res.json(result);
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

        //get Order 
        app.get('/addToProducts/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const product = await productsCollection.findOne(query);
            res.json(product);
        })

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
        app.put('/users/admin',verifyToken, async(req, res) => {
            const user = req.body;
            const requester= req.decodedEmail;
            if(requester){
                const requesterAccount = await usersCollection.findOne({email:requester});
                if(requesterAccount.role === 'admin'){
                    const filter = {email: user.email};
                    const updateDoc = { $set: { role: 'admin'} };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else{
                res.status(403).json({message: 'you do not have access to make admin'})
            }

            
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