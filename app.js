const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const axios = require('axios')
const cheerio = require('cheerio')

app.use(express.json());

const getXvideos = async (url) => {
  var x = await axios.get(url);
  const $ = cheerio.load(x.data)
  var videos = [];
  $('#content').find('div[data-is-channel="1"]').each((i, el) => {
  	var link = 'http://xvideos.com' + $(el).find('.thumb-inside > .thumb > a').attr('href');
  	let obj = {
  		link : link,
  		img : $(el).find('.thumb-inside > .thumb > a > img').attr('data-src'),
  		title: $(el).find('.thumb-under > .title > a').attr('title'),
  		duration: $(el).find('.thumb-under > .metadata > .bg > .duration').text(),
  		quality : $(el).find('.thumb-inside > .thumb > a > .video-hd-mark').text() ? $(el).find('.thumb-inside > .thumb > a > .video-hd-mark').text() : '360p',
  		low : '/low?url=' + encodeURIComponent(link),
  		high : '/high?url=' + encodeURIComponent(link),
  	}
  	videos.push(obj)
  })
  return videos;
}

async function xvideos(cat, k, page) {
  const url = 'https://xvideos.com/';
  var x = !cat && !k
    ? page > 1
      ? url + 'new/' + (page - 1)
      : url
    : !cat && k
      ? url + '?k=' + k.replace(/ /g, '+') + (page > 1 ? '&p=' + (page - 1) : '')
      : cat && !k
        ? url + cat + '/' + (page > 1 ? (page - 1) : '')
        : url + '?typef=' + cat + '&k=' + k.replace(/ /g, '+') + (page > 1 ? '&p=' + (page - 1) : '');

  console.log(x)
  return await getXvideos(x);
}

async function getVideoUrl(video) {
	var data = await axios.get(video);
	var low = data.data.split("html5player.setVideoUrlLow('")[1].split("'")[0]
	var high = data.data.split("html5player.setVideoUrlHigh('")[1].split("'")[0]
	return {low, high};
}


app.get('/', async (req, res) => {
	var data = await xvideos(req.query.cat, req.query.k, req.query.page);
	res.json(data);
})

app.get('/low', async (req, res) => {
	if(!req.query.url)
		res.sendStatus(404);

	var url = decodeURIComponent(req.query.url);
	var data = await getVideoUrl(url);
	res.redirect(data.low);
})


app.get('/high', async (req, res) => {
	if(!req.query.url)
		res.sendStatus(404);

	var url = decodeURIComponent(req.query.url);
	var data = await getVideoUrl(url);
	res.redirect(data.high);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
