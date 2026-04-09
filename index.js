const express = require("express");
const { logger, logEvents } = require('./middleware/logger')


const app = express();
const PORT = 5000

console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

// Routes
app.use('/', require('./routes/root'))

app.get('/api/test', (req, res) => {
	res.json({ message: 'API is working'})
})


// 404 
app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})


// Server 
app.listen(PORT, () => {
	console.log(`\n Server is running on http://localhost:${PORT}`)
})