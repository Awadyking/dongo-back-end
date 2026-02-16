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
const DB_link =  "mongodb://192.168.1.50:27017/dongo"
const Alphent = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
let LastIMG = ""

const User = require("./DB/users")
const Wallet = require("./DB/wallets")

mongoose.connect(DB_link)
.then(() => {console.log("Database Connected")})
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

if(data.pass == undefined || data.color == undefined || data.username == undefined || data.name == undefined){Res.status(400);Res.json({msg:"invaild Data"}); return;}
if(typeof(data.pass) != "string" || typeof(data.color) != "string" || typeof(data.username) != "string" || typeof(data.name) != "string"){Res.status(400);Res.json({msg:"invaild Data"}) ; return;}
if(data.username.length < 4 || data.name.length < 4){Res.status(400);Res.json({msg:"The Username and Name Must be more than 3 Charcter"}) ; return;}
if(data.username.includes(" ")){Res.status(400);Res.json({msg:"The Username Must Not include Space"}) ; return;}
if(!data.username.includes("@")){Res.status(400);Res.json({msg:"The Username Must include @"}) ; return;}

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
    if(user == undefined){Res.status(401).json({msg : "You don't have Access to do This"}) ; return ; }
    if(W == null){Res.status(404).json({msg:"Wallet Not Found !"}); return ;}
}else{Res.status(401).json({msg:"Wallet Not Found !"}) ; return;}
    

//Data 
    let Cash_Amount = 0
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

        default : 
        Res.status(404).json({msg : "UnKnown Type"})
        return;
        }


//Save
    proc_Arr.push(obj)
    for(p of proc_Arr){if(p.type == "Adding" || p.type == "Discount"){Cash_Amount = Cash_Amount + p.amount}}
if(data.data.type == "Adding" || data.data.type == "Discount"){
    await Wallet.findByIdAndUpdate(data.WID , {proc : proc_Arr , amount : Cash_Amount})
    Cash_Amount = 0
    proc_Arr = []
    obj = {}
    Res.json({msg : "The Proccsses is compeleted"})
}
else{
Cash_Amount = 0
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


    if(typeof(data) != "object" && 
     typeof(data.title) != "string" && 
     typeof(data.goal) != "number" &&
      !Req.headers.authorization.includes("Bearer")){
        Res.status(403); Res.json({msg : "Invaild Data !"})
      }

      
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
    newWallet.amount = 0
    newWallet.proc = []
    newWallet.users = [user.username]
    newWallet._id = GWID
    newWallet.save()
    UserWallets.push({WName : data.title , WID : GWID})
    await User.findByIdAndUpdate(user._id , {wallets : UserWallets})
    Res.json({msg : "Wallet Created Succssessfully"})
    
})


app.listen(Port , ()=>{console.log("Server running on port : " + Port +   " The Link : http://localhost:" + Port) })
