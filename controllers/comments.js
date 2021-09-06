const MongoClient=require('mongodb').MongoClient
const url="mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/test"
const mydb="skillenhancement"
const commentCollection="comments"
const postsCollection = "questionAnswer"
const userCollection = "users"
const collection = "globals"


const express=require('express')
const app = express()
const bodyparser = require("body-parser")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))

let commentId
let comment = []
let user
let validation

const request = require('request')
const validate_user = require('./authorize')
const get_token = require('./authorize')

// app.listen(8075,function(){
//     console.log("Server started")
// })

MongoClient.connect(url,function(err,db){
    if(err) throw err
    dbo=db.db(mydb)
    dbo.collection(collection).find({}).toArray(async function(err,result){
        commentId = result[0]["c_num"]
        initial_commentId = commentId
        //console.log(commentId)
    
        let adr = await dbo.collection('globals').find({}).toArray()
        adr = adr[0].adr
        

        async function cleanup(){
            dbo.collection('globals').updateOne({'c_num':initial_commentId},{$set:{'c_num':commentId}},(err,result)=>{
                //console.log('Server Closed')
                //process.exit(1)
    
            })
        }
    
        // process.on('exit',cleanup)
        // process.on('SIGINT',cleanup)
    

        //Get comments on the posts (question or answer) identified by a set of ids
        app.get(["/questions/:ids/comments","/answers/:ids/comments"],(req,res)=>{
            const ids = JSON.parse(req.params["ids"])
            let comments

            // eslint-disable-next-line no-use-before-define
            run().then(()=>{
                //console.log(comment)
                comments = comment
                comment=[]
                res.send(comments)
            })

            async function run(){
                ids.forEach(id=>{
                    dbo.collection(commentCollection).find({"PostId":id}).toArray(function(err,result){
                        if (err) 
                            throw err
                        else if (result.length == 0){
                            comment = ["Invalid Comment Id"]
                        }
                        else {
                            result.forEach(ele=>{
                                comment.push(ele)
                            })
                        }
                    })
                })
            }
        })

        //Get comments on the posts identified by a comment id
        app.get('/comments/:id',(req,res)=>{
            const id = Number(req.params["id"])
            dbo.collection(commentCollection).find({Id:id}).toArray((err,result)=>{
                if(result.length!=1) res.send('Invalid Comment Id')
                else res.send(result[0])
            })
        })

        //Get comments on the posts (question or answer) identified by a set of ids
        app.get(["/question/:id/comments","/answer/:id/comments"],(req,res)=>{
            const id = Number(req.params["id"])
            // console.log(id)
            dbo.collection(commentCollection).find({PostId:id}).toArray(function(err,result){
                if (err) throw err
                else res.send(result)
            })
        })

        //Create a new comment on the post identified by id
        app.post(["/questions/:id/comments/add","/answers/:id/comments/add"],(req,res)=>{
            let questionOwner
            //auth required
            const token = req.headers['x-access-token']
            if(token==null) res.send('Not Logged In')
            else{
                const id = Number(req.params["id"])
                dbo.collection(userCollection).find({token:token}).toArray(async (err,result)=>{
                    if(result.length==1 && (uv = await validate_user(token, result[0]))){
                        const User = result[0]
                        dbo.collection(postsCollection).find({'Id':id}).toArray(async (err,result)=>{
                            if(result.length==1){
                                if(result[0].ClosedDate!=null) res.send('Post is Already Closed')
                                else{
                                    const commentObj={
                                        "Id": commentId++,
                                        "PostId": id,
                                        "Score":0,
                                        "Text":req.body.body,
                                        "CreationDate": Date.now(),
                                        "Score":0,
                                        "UserDisplayName": User.username,
                                        "UserId":Number(User.Id)
                                    }
                                    await cleanup()
                                    questionOwner = result[0].OwnerUserId
                                    dbo.collection(commentCollection).insertOne(commentObj,function(err,result){
                                        if (err) throw err
                                        //console.log(result)

                                        //Notification
                                        new Promise((resolve,reject)=>{
                                            if(User.Id != questionOwner){
                                                // console.log('Comment Notification')
                                                request.post({
                                                    headers:{'content-type':'application/json',
                                                        'x-access-token':token},
                                                    url:`http://${adr}:8083/User/${questionOwner}/push`,
                                                    body:JSON.stringify({
                                                        Body: User.displayName + " has commented on your Post",
                                                        PostId:id
                                                    })
                                                },(err,response)=>{
                                                    if(err) throw err
                                                    // console.log(response.body)
                                                })
                                            }
                                            resolve()
                                        
                                        }).then(()=>{
                                            res.redirect(`/comments/${commentObj.Id}`)
                                        })
                                    })
                                }
                            }
                            else res.send('Invalid Post Id')
                        })
                    }
                    else res.send('Invalid User Credentials')
                })
            }
        })

        //Edit a comment identified by its id
        app.patch("/comments/:id/edit",(req,res)=>{
            //auth required
            //Only owner
            const token = req.headers['x-access-token']
            const id = Number(req.params["id"])
            if (token == null) res.send("Not Logged In")
            else{
                dbo.collection(userCollection).find({"token":token}).toArray(async function(err,result){
                    if (err) throw err
                    else if(result.length == 1 && (uv = await validate_user(token,result[0]))){
                        user = result[0]
                        dbo.collection(commentCollection).find({"Id":id}).toArray(function(err,result){
                            if (result.length==1 && result[0].UserId == user.Id){
                                dbo.collection(postsCollection).find({'Id':result[0].PostId}).toArray((err,result)=>{
                                    if(result.length == 1){
                                        if(result[0].ClosedDate!=null)res.send('Post is Already Closed')
                                        else{
                                            dbo.collection(commentCollection).updateOne({"Id":id},{$set:{"Text":req.body.body,"CreationDate":Date.now()}})
                                            if(result[0].PostTypeId==1)
                                                res.redirect(`/question/${result[0].Id}/comments`)
                                            else if(result[0].PostTypeId==2)
                                                res.redirect(`/answer/${result[0].Id}/comments`)
                                        }
                                    }
                                    else res.send('Invalid Post Id')
                                })
                            }
                            else res.send("No access to edit the comment")
                        })
                    }
                    else res.send("Invalid User")
                })
            }
        })

        //Delete comment identified by its id
        app.delete("/comments/:id/delete",(req,res)=>{
            //auth required
            //Only owner
            const token = req.headers['x-access-token']
            const id = Number(req.params["id"])
            if (token == null) res.send("Not Logged In")
            else{
                dbo.collection(userCollection).find({"token":token}).toArray(async function(err,result){
                    if (err) throw err
                    else if(result.length == 1 && (uv = await validate_user(token,result[0]))){
                        user = result[0]
                        dbo.collection(commentCollection).find({"Id":id}).toArray(function(err,result){
                            if (result.length==1){ 
                                if(result[0].UserId == user.Id){
                                    dbo.collection(commentCollection).deleteOne({Id:id})
                                    res.send('Comment \"'+result[0].Text+'\" is Deleted')
                                }
                                else res.send("No access to delete the comment")
                            }
                            else res.send('Invalid Comment Id')
                        })
                    }
                    else res.send("Invalid User")
                })
            }
        })

        //Casts an upvote on the given comment && Undo an down Vote
        app.patch(["/comments/:id/upvote","/comments/:id/downvote/undo"],(req,res)=>{
            //auth required
            const token = req.headers['x-access-token']
            const id = Number(req.params["id"])
            if (token == null) res.send("Not Logged In")
            else{
                dbo.collection(userCollection).find({"token":token}).toArray(async function(err,result){
                    if (err) throw err
                    else if(result.length == 1 && (uv = await validate_user(token,result[0]))){
                        dbo.collection(commentCollection).find({Id:id}).toArray(function(arr,result){
                            if(result.length==1){
                                const score = result[0]["Score"]
                                dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Score":score+1}},(err,result)=>{
                                    if(err) throw err
                                    res.redirect(`/comments/${id}`)
                                })
                            }
                            else res.send('Invalid Comment Id')
                        })
                    }
                    else res.send('Invalid User')
                })
            }
        })

        //Downvote a given comment && Undo an up vote
        app.patch(["/comments/:id/downvote", "/comments/:id/upvote/undo"],(req,res)=>{
            //auth required
            const token = req.headers['x-access-token']
            const id = Number(req.params["id"])
            if (token == null) res.send("Not Logged In")
            else{
                dbo.collection(userCollection).find({"token":token}).toArray(async function(err,result){
                    if (err) throw err
                    else if(result.length == 1 && (uv = await validate_user(token,result[0]))){
                        dbo.collection(commentCollection).find({Id:id}).toArray(function(arr,result){
                            if(result.length==1){
                                const score = result[0]["Score"]
                                dbo.collection(commentCollection).updateOne({"Id":Number(id)},{$set:{"Score":score-1}},(err,result)=>{
                                    if(err) throw err
                                    res.redirect(`/comments/${id}`)
                                })
                            }
                            else res.send('Invalid Comment Id')
                        })
                    }
                    else res.send('Invalid User')
                })
            }
        })

        //Get the comments posted by the users identified id
        app.get(["/users/:id/comments"],(req,res)=>{
            const id = Number(req.params["id"])
            // console.log(id)
            dbo.collection(userCollection).find({'Id':id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection(commentCollection).find({UserId:id}).toArray(function(err,result){
                        if (err) throw err
                        else res.send(result)
                    })
                }
                else res.send('Invalid User Id')
            })
        })
    })
})

module.exports = app