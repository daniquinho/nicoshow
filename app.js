const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const axios = require('axios')
const cheerio = require('cheerio')

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/get', async (req, res) => {
  var f = await axios.get('https://google.com');
  const $ = cheerio.load(f.data);
  var t = $('span').text();
  res.send(t);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
