const express = require("express")
const cors = require("cors")
const app = express();
const multer = require("multer")
const path = require("path")
const mongoose = require("mongoose")
app.use(express.urlencoded({extended : false}))
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname , "img")))
const Port = 8000 ; 
const DB_link =  "mongodb://localhost:27017/dongo"
const Alphent = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
let LastIMG = ""

const User = require("./DB/users")
const Wallet = require("./DB/wallets")
const SecParty = require("./DB/SecParty")

mongoose.connect(DB_link)
.then(() => {console.log("Data Base Connected")})
.catch((error) => {console.log("This an Error { " +  error + "}")})

const storage = multer.diskStorage({
destination : function  (req , file , cb){
cb(null , path.join(__dirname , "/img"))

},
filename: async  function(req , file , cb){
    let AllUsers = await User.find()
    let LastID = 0
    let filename = file.originalname
    let ex = ""
    for(U of AllUsers){LastID = U._id}
    for(let i = filename.length - 4 ; i < filename.length ; i++){ex += filename[i]}
    cb(null , LastID + ex )
    LastIMG = LastID + ex
}


})

const Upload = multer({storage})
app.get("/" , (Req , Res)=>{
    Res.send("<div style='width:100%; text-align:center; font-size:18px;'>Dongo Server is Running ... ! <br> Powered by Awadyking  <br> All Copyright Reserved © 2024</div>")
})

async function GenWID(){
    let WID = Math.floor(Math.random() * 1000000000);
    let AllWallets = await Wallet.find()
    for(w of AllWallets){if(w._id == WID){GenWID() ; return;}}
    return(WID)
    }


function GenToken(){
    let token = "";
    function repeat(){
        var index = Math.floor(Math.random() * 100)
        if(index < 50){token = token + Alphent[index]}
        else{repeat()}
    }
    for(let i = 0 ;  token.length < 50 ; i++ ){repeat()}
    return(token)
    }





app.post("/register" , Upload.single("img") , async(Req , Res)=>{
let data = Req.body 
let Exit = false
AllUsers = await User.find()

if(data.pass == undefined || data.color == undefined || data.username == undefined || data.name == undefined){Res.status(400);Res.json({msg:"invaild Data"});}
else{
if(data.pass.length > 7){
for(U of AllUsers){
if(U.username == data.username){Exit = true}
}
if(Exit == true){ Res.status(401);Res.json({msg:"This Username is Already Exited"}) ;}
else{

let lastID = 0
for(U of AllUsers){lastID = U._id}
let newUser = new User()
newUser.username = data.username
newUser._id = lastID  + 1
newUser.name = data.name
newUser.pass = data.pass
newUser.wallets = []
newUser.processes = []
newUser.token = ""
newUser.img = LastIMG
newUser.color = data.color
LastIMG = ""
newUser.save()
console.log(`The User ${data.username} is created in ${new Date()}`)

Res.json({msg:"This Account is Created Succsefully ! Go To Login"})
}
}
else{Res.status(400); Res.json({msg:"The Password Must be more than 8 Charcter"});}
}
})




app.post("/login" , async(Req , Res)=>{
let data = Req.body
AllUsers = await User.find()
let found = false
let userID ;

for(U of AllUsers){if(data.username == U.username){found = true ; userID = U._id ;}}

if(found == true){
let user = await User.findById(userID);

if(user.pass == data.pass){
await User.findByIdAndUpdate(userID , {token : GenToken() })
let userData = await User.findById(userID)
userData.pass = "#####"
let Obj = {
    data : userData , 
    msg : `Hello ${userData.name} ! You 're Logged in Succsesfully`
}

console.log(`The User ${userData.username} Logged in ${new Date()}`)

Res.status(200).json(Obj) 
}
else{Res.status(400).json({msg : "Password is Not Correct !"})}
}else{Res.status(404).json({msg:"User Not Found !"} )}



})

app.get("/mywallets/:token" , async(Req , Res)=>{
let token = Req.params.token
let AllUsers = await User.find()
let Found = false
for(U of AllUsers){
if(token == U.token){Res.json(U.wallets) ; Found = true}
}
if(Found == false){Res.status(404); Res.json({msg : "Invaild Token ! Pleae Logout & Login Again"}) }
})


app.get("/mycards/:wid/:token" , async(Req , Res)=>{
    let token = Req.params.token
    let wid = Req.params.wid
    let W = await Wallet.findById(wid)
    let AllUsers = await User.find()
    let user
    let Found = false
    for(U of AllUsers){
    if(token == U.token){Found = true ; user= U}
    
    }
    if(Found == false){Res.status(404); Res.json({msg : "Invaild Token ! Pleae Logout & Login Again"}) }
    else{
       for(u of W.users){if(user.username == u){Res.json(W.cards)}}
    }
    })



app.get("/status/:user/:token" , async(Req , Res)=>{
let AllUsers = await User.find()
let user = Req.params.user
let token = Req.params.token
let EUser ;
for(U of AllUsers){if(U.username === user){EUser = U}}
if(EUser == undefined){Res.status(404) ; Res.json({msg:"User Not Found !"})}
else{

if(token === EUser.token){Res.send(true)}
else{Res.status(401) ; Res.json({msg:"This Account is Used in Another device ! Please Login Again"})}
}
})


app.get("/profile/:user/:token" , async(Req , Res)=>{
let AllUsers = await User.find()
let token = Req.params.token
let user = Req.params.user
let EUser ;

for(U of AllUsers){if(U.username === user){EUser = U}}

if(EUser == undefined){Res.status(404) ; Res.json({msg:"User Not Found !"})}
else{

if(token === EUser.token){
EUser.pass = "####"
Res.send(EUser)
}
else{Res.status(401) ; Res.json({msg:"This Account is Used in Another device ! Please Login Again"})}
}





})







app.get("/proc/:id/:token/" , async(Req , Res)=>{
let id = Req.params.id
let token = Req.params.token
let AllWallets = await Wallet.find()
let curWallet = await Wallet.findById(id)
let AllUsers = await User.find()
let SeUser ;
let UserID
let WFind = false
for(U of AllUsers){if(token == U.token){SeUser = U.username ; UserID = U._id ;}}
for(W of AllWallets){if(W._id == id){WFind = true}}
if(WFind == false){Res.status(404) ; Res.json({msg:"Wallet is Not Found"})}
else{
if(SeUser != undefined){
let Accsses = false 
for(us of curWallet.users){if(us == SeUser){Accsses = true}}
if(Accsses == true){Res.json({curWallet})}
else{Res.status(401) ; Res.json({msg:"You 're Not Accsses to Get This Information"})}
}
else{Res.status(404); Res.json({msg:"Invaild Token ! Pleae Logout & Login Again"})}
}


})





app.post("/newproc" , async(Req , Res)=>{

let AllUsers = await User.find()
let user = undefined ;
let data = Req.body
let W = await Wallet.findById(data.WID)

//Validate

if(typeof(data.data) != "object" 
    && typeof(data.data.title ) != "string"
    && typeof(data.data.type) != "string"
    && typeof(data.data.amount) != "number"
    && typeof(data.WID) == "string"){Res.status(400).json({msg: "Invaild Data"}) ; return;}
if(Req.headers.authorization.includes("Bearer") ){
    let token = Req.headers.authorization.replace("Bearer " , "")
    for(U of AllUsers){if(token == U.token){user = U} ; }
    if(user == undefined){Res.status(401).json({msg : "Your Not Accses to do This"}) ; return ; }
    if(W == null){Res.status(404).json({msg:"Wallet Not Found !"}); return ;}
}else{Res.status(401).json({msg:"Wallet Not Found !"}) ; return;}
    

//Data 
    let Cash_Amount = 0
    let Cards_Amount = 0
    let Total = 0
    let proc_Arr = W.proc
    let obj = {
        id : proc_Arr.length , 
        title : data.data.title , 
        date : new Date() , 
        user : user.name , 
        username : user.username , 
        type : "", 
        WID : data.WID  , 
     }

        switch(data.data.type){
        case("Adding"):
            if(data.data.amount > 0){obj.type = "Adding" ; obj.amount = data.data.amount}
            else{Res.status(400).json({msg:"Invaid Amount"}) ; return;}
        break;

        case("Discount"):
            if(data.data.amount < 0){obj.type = "Discount"; obj.amount = data.data.amount}
            else{Res.status(400).json({msg:"Invaid Amount"}) ; return;}
        break;

        case("b-Discount"):
            if(data.data.amount < 0){
                if(typeof(data.CID) == "number"){
                let  i = null
                for(let x = 0 ; x < W.cards.length ; x++){if(W.cards[x].id == CID){i=x}}
                if(i == null){Res.status(404).json({msg : "Card Not Found !"}); return;}
                obj.title = obj.title + " - " + W.cards[i].name
                obj.type = "b-Discount"
                W.cards[i].amount = W.cards[i].amount + data.data.amount;

                }else{Res.status(400).json({msg : "Invaild Data"}) ; return;}
            }else{Res.status(400).json({msg:"Invaid Amount"}) ; return;}
        break;
        case("b-Adding"):
            if(data.data.amount > 0){
                if(typeof(data.CID) == "number"){
                    let  i = null
                    for(let x = 0 ; x < W.cards.length ; x++){if(W.cards[x].id == CID){i=x}}
                    if(i == null){Res.status(404).json({msg : "Card Not Found !"}); return;}
                    obj.title = obj.title + " - " + W.cards[i].name
                    obj.type = "b-Adding"
                    W.cards[i].amount = W.cards[i].amount + data.data.amount;
    
                    }else{Res.status(400).json({msg : "Invaild Data"}) ; return;}

            }else{Res.status(400).json({msg:"Invaid Amount"}) ; return;}
        break;

        default : 
        Res.status(404).json({msg : "UnKnown Type"})
        break;
        }


//Save
    proc_Arr.push(obj)
    user.proccsses.push(obj)
    for(p of proc_Arr){if(p.type == "Adding" || p.type == "Discount" || p.type == "Borrow" || p.type == "Lending"){Cash_Amount = Cash_Amount + p.amount}}
    for(c of W.cards){Cards_Amount = Cards_Amount + c.amount}
        Total = Cash_Amount + Cards_Amount
if(data.data.type == "Adding" || data.data.type == "Discount" ||data.data.type == "b-Adding" || data.data.type == "b-Discount"){
await Wallet.findByIdAndUpdate(data.WID , {proc : proc_Arr , amount : Total , cash : Cash_Amount})
let s = true
for(p of user.proccsses){if(data.WID == p.WID && obj.id == p.id){s = false}}
if(s){await User.findByIdAndUpdate(user._id , {proccsses : user.proccsses})}

Cash_Amount = 0
Cards_Amount = 0
Total = 0
proc_Arr = []
obj = {}

Res.json({msg : "The Proccsses is compeleted"})
}
else{
Cash_Amount = 0
Cards_Amount = 0
Total = 0
proc_Arr = []
obj = {}
Res.status(502).json({msg : "Something Went Wrong"})
}

    })




app.post("/delete-account" , async(Req , Res)=>{
    let data = Req.body
    let user ; 
    let AllUsers = await User.find()
    if(data != undefined && data.username != undefined && data.pass != undefined && Req.headers.authorization != undefined){
        let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
    for(U of AllUsers){if(U.username == data.username){user = U}}
    if(user != undefined){
    if(token == user.token){
            if(data.pass == user.pass){
            await  User.findByIdAndDelete(user._id)
             Res.json({msg:"Your Account Deleted Successfully"})
            }else{Res.status(403) ; Res.json({msg:"The Password Not Correct !"})}
    }else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess"})}
    
    }else{Res.status(404); Res.json({msg : "This User Not Found !"})}
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}

    })

app.get("/wallet/:wid/:token" , async(Req , Res)=>{
    let data = Req.params
    let user ; 
    let AllUsers = await User.find()
    if(typeof(data) == "object" && typeof(data.wid) == "string" && data.token){
    for(U of AllUsers){if(data.token == U.token){user = U ;}}
    if(user != undefined){
        let x = await Wallet.findById(data.wid)
        if(x != null){Res.json(x)}
        else{Res.status(404) ; Res.json({msg : "This Wallet Not Found !"})}
    }else{Res.status(404); Res.json({msg : "This User Not Found !"})}
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}
})



app.post("/join-wallet" , async(Req , Res)=>{
let data = Req.body
let user ; 
let AllUsers = await User.find()
if(typeof(data) == "object" &&  typeof(data.WID) == "string" && Req.headers.authorization.includes("Bearer")){
let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
for(U of AllUsers){if(token == U.token){user = U}}
if(user != undefined){

        let S = await Wallet.findById(data.WID)
        if(S != null){
        let User_Arr = S.users
        let Wallets_Arr = user.wallets
        Wallets_Arr.push({WName : S.title , WID : S._id})
        User_Arr.push(user.username)
        await User.findByIdAndUpdate(user._id , {wallets : Wallets_Arr })
        await Wallet.findByIdAndUpdate(data.WID , {users : User_Arr})
        Res.json({msg:"You 're Join to Wallet Succssfully"})
        }else{Res.status(404) ; Res.json({msg : "Wallet Not Found !"})}


}else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess or User Not Found"})}
}else{Res.status(403); Res.json({msg : "Invaild Data !"})}
})

app.post("/delete-wallet" , async(Req , Res)=>{
    let data = Req.body
    let user ; 
    let AllUsers = await User.find()
    if(typeof(data) == "object" &&  typeof(data.WID) == "string" && Req.headers.authorization.includes("Bearer")){
    let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
    for(U of AllUsers){if(token == U.token){user = U}}
    if(user != undefined){
            let S = await Wallet.findById(data.WID)
            if(S != null){

            let User_Arr = S.users
            let Wallets_Arr = user.wallets
            let SW = Wallets_Arr.filter((i)=>{return data.WID == i.WID})
            let SU = User_Arr.filter((i)=>{return i == user.username})
            Wallets_Arr.splice(Wallets_Arr.indexOf(SW) , 1)
            User_Arr.splice(User_Arr.indexOf(SU), 1)
            await User.findByIdAndUpdate(user._id , {wallets : Wallets_Arr })
            await Wallet.findByIdAndUpdate(data.WID , {users : User_Arr})
            Res.json({msg:"You 're Delete this Wallet Succssfully" })




            }else{Res.status(404) ; Res.json({msg : "Wallet Not Found !"})}
    }else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess or User Not Found"})}
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}
})








app.post("/create-wallet" , async(Req , Res)=>{
    let data = Req.body
    let user ; 
    let AllUsers = await User.find()
    let AllWallets = await Wallet.find()
    if(typeof(data) == "object" &&  typeof(data.title) == "string" && typeof(data.goal) == "number" && Req.headers.authorization.includes("Bearer")){
    let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
    for(U of AllUsers){if(token == U.token){user = U}}
    let UserWallets = user.wallets
    let GWID = await GenWID()
    let Found = false
    for(W of AllWallets){if(W._id == String(GWID)){Found = true}}
    if(Found){Res.status(403).json({msg:"Something Went Wrong !"}) ;return;}
    let newWallet = new Wallet()
    newWallet.goal = data.goal
    newWallet.title = data.title
    newWallet.cash = 0
    newWallet.dept = 0
    newWallet.for = 0
    newWallet.amount = 0
    newWallet.cards = []
    newWallet.proc = []
    newWallet.users = [user.username]
    newWallet._id = GWID
    newWallet.save()
    UserWallets.push({WName : data.title , WID : GWID})
    await User.findByIdAndUpdate(user._id , {wallets : UserWallets})
    Res.json({msg : "Wallet Created Succssessfully"})
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}
})






app.post("/new-card" , async(Req , Res) =>{
    let data = Req.body
    let user ; 
    let AllUsers = await User.find()
    if(typeof(data) == "object" && 
     typeof(data.expire) == "string" && 
     typeof(data.bank) == "string" &&
     typeof(data.last) == "number" &&
     typeof(data.name) == "string" &&
     typeof(data.WID) == "string" &&
      Req.headers.authorization.includes("Bearer")
    ){
    let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
    for(U of AllUsers){if(token == U.token){user = U}}
    if(user != undefined){

            let S = await Wallet.findById(data.WID)
            if(S != null){
            
            S.cards.push({
                id : Math.floor(Math.random()* 1000000),
                name : data.name , 
                amount : 0 , 
                last: data.last , 
                bank : data.bank ,
                expired : data.expire
            })
            await Wallet.findByIdAndUpdate(data.WID , {cards : S.cards})
            Res.json({msg : "Card Added Succssesfully"})
            }else{Res.status(404) ; Res.json({msg : "Wallet Not Found !"})}
    
    }else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess or User Not Found"})}
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}

    
})


app.post("/delete-card" , async(Req , Res) =>{
    let data = Req.body
    let user ; 
    let AllUsers = await User.find()
    if(typeof(data) == "object" && 
     typeof(data.WID) == "string" &&
     typeof(data.CID) == "number" &&
      Req.headers.authorization.includes("Bearer")
    ){
    let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
    for(U of AllUsers){if(token == U.token){user = U}}
    if(user != undefined){
            let S = await Wallet.findById(data.WID)
            if(S != null){
            let SU = S.cards.filter((i)=>{return i.id == data.CID})
            if(SU != undefined || null){
                S.cards.splice(S.cards.indexOf(SU), 1)
                await Wallet.findByIdAndUpdate(data.WID , {cards : S.cards})
                Res.json({msg : "Card Deleted Succssesfully"})
            }else{Res.status(404) ; Res.json({msg: "Card Not Found !"})}
            }else{Res.status(404) ; Res.json({msg : "Wallet Not Found !"})}    
    }else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess or User Not Found"})}
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}
})



app.post("/create-sec-party" , async(Req , Res)=>{
    let data = Req.body
    let user ; 
    let AllUsers = await User.find()
    if(typeof(data) == "object" && 
     typeof(data.name) == "string" && 
     typeof(data.amount) == "number" &&
     typeof(data.type) == "string" &&
     typeof(data.WID) == "string" &&
     Req.headers.authorization.includes("Bearer")
    ){
    let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
    let W = await Wallet.findById(data.WID)
    let Cards_Amount = 0
    
    for(U of AllUsers){if(token == U.token){user = U}}
    if(user != undefined){
        if(data.type == "Lending" && data.amount < 0 || data.type == "Borrow" && data.amount > 0){
            if(W != null){
                let t = ""
                
                if(data.type === "Lending"){t = "Lending to "}
                else{t= "Borrow From "}

            let Cash_Amount = 0
            let proc_Arr = W.proc
            let newSecParty = new SecParty() 
            newSecParty.name = data.name 
            newSecParty.date = new Date() 
            newSecParty.type = data.type 
            newSecParty.amount = data.amount 
            newSecParty.createdBy = user.username 
            newSecParty.status = true 
            newSecParty.WID = data.WID
            newSecParty._id = Math.floor(Math.random() * 10000000000)
            proc_Arr.push({
                id : proc_Arr.length , 
                title : t + data.name ,  
                date : new Date() , 
                amount : data.amount , 
                user : user.name , 
                type : data.type,
                username : user.username , 
                WID : data.WID
                })
                for(p of proc_Arr){if(p.type == "Adding" || p.type == "Discount" || p.type == "Lending" || p.type == "Borrow")Cash_Amount =  Cash_Amount + p.amount}
                for(c of W.cards){Cards_Amount = Cards_Amount + c.amount}
                if(data.type == "Lending"){
                            await Wallet.findByIdAndUpdate(data.WID , { 
                            proc : proc_Arr , 
                            amount : Cash_Amount + data.amount + Cards_Amount ,
                            cash : Cash_Amount + data.amount , 
                            for : W.for + data.amount
                        })    
                }else if(data.type == "Borrow"){
                        await Wallet.findByIdAndUpdate(data.WID , { 
                            proc : proc_Arr , 
                            amount : Cash_Amount + data.amount ,
                            cash : Cash_Amount + data.amount - Cards_Amount , 
                            dept : W.dept + data.amount
                        }) 
                }
                await newSecParty.save()          
                
            Res.json({msg : `Second Party Created Succsses !`})

            }else{Res.status(404); Res.json({msg : "Wallet Not Found !"})}


    }else{Res.status(403); Res.json({msg : "UnKnown Type or Amount!"})}



    }else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess or User Not Found"})}
    }else{Res.status(403); Res.json({msg : "Invaild Data !"})}





})




app.get("/sec-parties/:WID/:token" , async(Req , Res)=>{
    let token = Req.params.token
    let WID = Req.params.WID
    let AllParties = await SecParty.find()
    let FParties = [] 
    let W = await Wallet.findById(WID) 
    let Found = false
    let user ;
    let AllUsers = await User.find()
    for(U of AllUsers){if(token == U.token){user = U}}
    if(W == null){Res.status(404); Res.json({msg : "Wallet Not Found !"})}
    else{
        for(US of W.users){if(user.username == US){Found = true}}
        if(Found){
           AllParties.map((i)=>{
            if(i.WID == WID){
                FParties.push(i)
            }
           })
           Res.json({data : FParties})
        }
    }
    if(Found == false){Res.status(404); Res.json({msg : "Invaild Token ! Pleae Logout & Login Again"}) }
    })






    app.post("/submit-sec-party" , async(Req , Res)=>{
        let data = Req.body
        let user ; 
        let AllUsers = await User.find()

        if(typeof(data) == "object" && 
         typeof(data.SID) == "string" && 
         typeof(data.WID) == "string" &&
         Req.headers.authorization.includes("Bearer")
        ){

        let token = Req.headers.authorization.replace("Bearer " , "") ?? ""
        let W = await Wallet.findById(data.WID)
        let S = await SecParty.findById(data.SID)
        let Cards_Amount = 0
        
        for(U of AllUsers){if(token == U.token){user = U}}

        if(user != undefined){
                if(W != null && S != null){
                    let tx = ""
                    let zx = ""

                    if(S.type === "Lending"){tx = "Money Back from "; zx="Adding"}
                    else{tx= "Money Back to "; zx= "Discount"}

                    let Cash_Amount = 0
                    let proc_Arr = W.proc
                proc_Arr.push({
                    id : proc_Arr.length , 
                    title : tx + S.name ,  
                    date : new Date() , 
                    amount : 0 - S.amount , 
                    user : user.name , 
                    type : zx,
                    username : user.username , 
                    WID : data.WID
                    })
                for(p of proc_Arr){
                    if(p.type == "Adding" || p.type == "Discount" || p.type == "Lending" || p.type == "Borrow"){
                        Cash_Amount =  Cash_Amount + p.amount}
                    }
                for(c of W.cards){Cards_Amount = Cards_Amount + c.amount}


                    if(S.type == "Lending"){
                                await Wallet.findByIdAndUpdate(data.WID , { 
                                proc : proc_Arr , 
                                amount : (Cash_Amount - S.amount) + Cards_Amount ,
                                cash : Cash_Amount - S.amount , 
                                for : W.for + (0 - S.amount)
                            })    
                    }else if(S.type == "Borrow"){
                            await Wallet.findByIdAndUpdate(data.WID , { 
                                proc : proc_Arr , 
                                amount : (Cash_Amount - S.amount) + Cards_Amount,
                                cash : Cash_Amount - S.amount , 
                                dept : W.dept + (0 - S.amount)
                            }) 
                    }
                    await SecParty.findByIdAndUpdate(data.SID , {status : false})         
                    
                Res.json({msg : `Second Party Finished Succsses !`})
    
                }else{Res.status(404); Res.json({msg : "Wallet or SID Not Found !"})}
    
    
        }else{Res.status(401) ; Res.json({msg:"You 're Not Acsses to Make This proccess or User Not Found"})}
        }else{Res.status(403); Res.json({msg : "Invaild Data !"})}

    
    })




app.listen(Port, () =>{
    console.log(`Server is started on port ${Port} , The Link: http://localhost:${Port}`)
})