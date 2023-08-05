const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const axios = require('axios')
const cheerio = require('cheerio')

app.use(express.json());

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  return array;
}



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


const getBoyfriendVideos = async (search='', page=1) => {
  var url = 'https://www.boyfriendtv.com/';
  if(search){
  	url+= 'search/' + search.replace(/ /g, '+') + '/?page=' + page;
  }else{
  	url += 'videos/best-recent/' + page;
  }
  console.log(url)
  var x = await axios.get(url);
  const $ = cheerio.load(x.data)
  var videos = [];
  $('ul.block.ul-no-dots > li.js-pop.thumb-item.videospot').each((i, el) => {
  	var dur = '';
  	$(el).find('.fs11.viddata.flr.time-label-wrapper').children().each((j, e) => {
  		if(!$(e).attr('class'))
  			dur = $(e).text()
  	})
  	var link = 'https://www.boyfriendtv.com/videos/' + $(el).find('.thumb.vidItem').attr('data-video-id');
  	videos.push({
  		title: $(el).find('p.titlevideospot > a').attr('title'),
  		link: link,
  		img: $(el).find('.thumb-inner-wrapper > a > img').attr('src') ? $(el).find('.thumb-inner-wrapper > a > img').attr('src'): null,
  		quality: $(el).find('span.text-active.bold').text() || "360p",
  		duration: dur.trim() || '00:00',
  		download: '/downloadBoyfriend?url=' + encodeURIComponent(link)
  	})
  })
  return videos;
}

async function downloadBoyfriend(url) {
	var data = await axios.get(url);
	const $ = cheerio.load(data.data);

	var video = $('video source').attr('src');
	return video;
} 

async function randomVideos(search, page) {
	var x = await xvideos('gay', search, page);
	var b = await getBoyfriendVideos(search, page);

	var tudo = x.concat(b);
	tudo = shuffleArray(tudo)

	return tudo;
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

app.get('/boyfriend', async (req, res) => {
	var data = await getBoyfriendVideos()
	res.json(data);
})

app.get('/downloadBoyfriend', async (req, res) => {
	if(!req.query.url)
		res.sendStatus(404);

	var url = decodeURIComponent(req.query.url);
	var data = await downloadBoyfriend(url);
	res.redirect(data);
})

app.get('/random', async (req, res) => {
	var data = await randomVideos(req.query.k, req.query.page);
	res.json(data);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
