const multer = require("multer")
const path = require("path")

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../upload'))
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + path.extname(file.originalname))
    }
})


var upload = multer({
    storage: storage,
    limits:{
        fieldSize: 1024 * 1024 * 10
    },
    // fileFilter: fileFilter
})

module.exports = {
    upload: upload
}