const express = require("express");

const app = express();
const PORT = 5000

// Middlewares
app.use(express.json())

// Routes
app.get('/', (req, res) => {
	res.send('Server is running')
})

app.get('/api/test', (req, res) => {
	res.json({ message: 'API is working'})
})


// Server 
app.listen(PORT, () => {
	console.log(`\n Server is running on http://localhost:${PORT}`)
})