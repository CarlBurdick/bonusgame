const express = require('express')
const path = require('path')
const app = express()
const port = 3000

app.use("/pixi", express.static(path.join(__dirname,'dist/pixi')))
app.use("/js", express.static(path.join(__dirname,'dist/js')))
app.use("/assets", express.static(path.join(__dirname,'dist/assets')))
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'dist/index.html'))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))