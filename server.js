import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import bodyParser from 'body-parser'
import Pusher from 'pusher'
import Grid from 'gridfs-stream'
import GridFsStorage from 'multer-gridfs-storage'
import mongoPosts from './postModel.js'
Grid.mongo=mongoose.mongo
//for storing images


//app config

const app=express();
const port =process.env.PORT ||9000


//middleware
app.use(bodyParser.json());
app.use(cors());

//db config
const Url="mongodb+srv://pritsavani:Prit@cluster0.yzahjbj.mongodb.net/facebook-db?retryWrites=true&w=majority"

const conn = mongoose.createConnection(Url,{

});
let gfs,gridfsBucket;
conn.once('open',()=>{
    console.log("connected")
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'images'
    });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('images');
   
   // gfs=Grid(conn.db,mongoose.mongo)
    //gfs.collection('images');
})


const storage= new GridFsStorage({
    url: Url,
    file:(req,file)=>{
        return new Promise((resolve,reject)=>{
            const filename=`image-${Date.now()}${path.extname(file.originalname)}`
            const fileInfo={
                filename:filename,
                bucketName:'images'
            };
            resolve(fileInfo);
        });
    }
});

const upload=multer({storage});

mongoose.connect(Url,{

})


//api routes
app.get('/',(req,res)=>{
    res.status(200).send("hello")
})

app.post('/upload/image',upload.single('file'),(req,res)=>{
    res.status(201).send(req.file);
})

app.post('/upload/post',(req,res)=>{
    const dbPost= req.body
    console.log(dbPost)
    mongoPosts.create(dbPost,(err,data)=>{
        if(err){
res.status(500).send(err)
        }
        else{
res.status(201).send(data)
        }
    })
})

app.get('/retrieve/posts',(req,res)=>{
    mongoPosts.find((err,data)=>{
        if(err){
            res.status(500).send(err)
                    }
                    else{
                        data.sort((b,a)=>{
                            return a.timestamp-b.timestamp;
                        })
            res.status(200).send(data)
                    }
    })
})

app.get('/retrieve/images/single',(req,res)=>{
    gfs.files.findOne({filename:req.query.name},(err,file)=>{
        if(err){
            res.status(500).send(err)
                    }
                    else{
                        if(!file ||file.length === 0){
                            res.status(404).json({err:'file not found'})

                        }
                        else{
                            const readStream = gridfsBucket.openDownloadStream(file.filename);
       
                           //  const readstream=gfs.createReadStream(file.filename);
                             readStream.pipe(res)
                        }
           
                    }
    })
})
//listen


app.listen(port,()=>{
console.log("listening");
})