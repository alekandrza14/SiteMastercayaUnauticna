const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

const UPLOADS="uploads";
const COVERS="covers";
const DB="files.json";

[UPLOADS,COVERS].forEach(dir=>{
    if(!fs.existsSync(dir))
        fs.mkdirSync(dir);
});

if(!fs.existsSync(DB)){
    fs.writeFileSync(DB,"[]");
}

app.use(express.static("public"));
app.use("/covers",express.static(COVERS));

const storage=multer.diskStorage({

destination:(req,file,cb)=>{

if(file.fieldname==="cover")
cb(null,COVERS);
else
cb(null,UPLOADS);

},

filename:(req,file,cb)=>{

cb(null,Date.now()+"-"+file.originalname);

}

});

const upload=multer({

storage,

fileFilter:(req,file,cb)=>{

if(file.fieldname==="zipfile"){

if(path.extname(file.originalname)!==".zip")
return cb(new Error("Только zip"));

}

if(file.fieldname==="cover"){

const ok=[".png",".jpg",".jpeg",".webp"];

if(!ok.includes(
path.extname(file.originalname).toLowerCase()
))
return cb(new Error("Неверная картинка"));

}

cb(null,true);

}

});

app.post(
"/upload",
upload.fields([
{name:"zipfile",maxCount:1},
{name:"cover",maxCount:1}
]),
(req,res)=>{

const zip=req.files.zipfile?.[0];
const cover=req.files.cover?.[0];

if(!zip)
return res.send("ZIP отсутствует");

const data=JSON.parse(
fs.readFileSync(DB)
);

data.push({

file:zip.filename,

original:zip.originalname,

cover:cover ? cover.filename : null

});

fs.writeFileSync(
DB,
JSON.stringify(data,null,2)
);

res.redirect("/");

});

app.get("/files",(req,res)=>{

res.json(
JSON.parse(
fs.readFileSync(DB)
)
);

});

app.get("/download/:name",(req,res)=>{

res.download(
path.join(
__dirname,
UPLOADS,
req.params.name
)
);

});

app.listen(3000, "0.0.0.0");