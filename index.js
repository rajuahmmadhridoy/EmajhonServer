const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const fs = require('fs-extra')
const fileUpload = require("express-fileupload")
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'))
app.use(fileUpload())
const port = 4000;

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gegqi.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const appointmentCollection = client.db("DoctorsPortal").collection("appointments");
  const doctorCollection = client.db("DoctorsPortal").collection("doctors");
    app.post('/addappointment',(req,res)=>{
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
        .then(result => {
            res.send(result.insertedCount > 0)
        })
    })
    app.post('/appointments',(req,res)=>{
      const date = req.body;
      console.log(date.date);
      appointmentCollection.find({date:date.date})
      .toArray((err,documents)=>{
        res.send(documents)
        console.log(documents);
      })
    })



//get all appointments
app.get('/allAppointments',(req,res)=>{
  appointmentCollection.find({})
  .toArray((err,documents)=>{
    res.send(documents)
  })

})




// update
app.patch('/updateAppointment/:id',(req,res)=>{
  const id = req.params.id;
  const action = req.body.action;
  console.log(id);
  console.log(action);
  appointmentCollection.updateOne({_id: ObjectId(id)},{$set:{action:action}})
  .then(result =>{
    res.send(result.modifiedCount > 0)
  })
})


// Add a doctor
app.post('/addDoctor',(req,res)=>{
  const name = req.body.name;
  const email = req.body.email;
  const file = req.files.file;
  console.log(name,email,file);
  const filePath = `${__dirname}/doctors/${file.name}`
  file.mv(filePath, err=>{
    if(err){
      console.log(err)
      return res.status(500).send({msg:'Faild to upload Image'})
    }
    const newImage = fs.readFileSync(filePath)
    const encImg = newImage.toString('base64')
    var image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img:Buffer(encImg,'base64')
    }
    doctorCollection.insertOne({name,email,image})
    // res.send({name:file.name,path:`/${file.name}`})
    .then(result =>{
      fs.remove(filePath, err=>{
        console.log(err);
        res.send(result.insertedCount > 0)
      })
    })
  })
})
});
app.listen(process.env.PORT || port);
