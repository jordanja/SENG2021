//load some node js modules
var express = require('express');
var router = express();
var request = require('request');

//api keys
var weatherApiKey = '4d30a475c46e1fc7e5c6d9f7ee6517be';
var flickrApiKey = 'd417fc0243e0d8899645e1ff174d67d4';
var mapsApiKey = 'AIzaSyDydgd2jbeRErhSowqagqkqVqARAPUieAw';

//time for 2016-01-01
//var unixTime = '1451606400';

/* GET home page. */
router.get('/', function(req, res, next) {
    var regrex = /.*\, .* (.*) (\d+)\, \w+/g;
    var suburb = req.query.address;
    var match = regrex.exec(suburb);
    console.log("Match 1: " + match[1] + " Match 2: " + match[2]);

    var test_lat = req.query.lat;
    var test_long = req.query.long;

    var placeImages = [];
    var fiveDayWeather = [];
    var placeDetails = {};

    //api url links
    var weatherApi = 'http://api.openweathermap.org/data/2.5/weather?zip=+' + match[2] +
        ',au&appid=' + weatherApiKey + '&mode=json&units=metric';
    var fiveDayWeatherApi = 'http://api.openweathermap.org/data/2.5/forecast?' +
        'lat=' + test_lat + '&lon=' + test_long + '&appid=' + weatherApiKey + '&units=metric';
    var flickrApi = 'https://api.flickr.com/services/rest/?method=flickr.photos.search' +
        '&api_key=' + flickrApiKey + '&sort=interestingness-desc' + '&safe_search=1' +
        '&media=photos&lat=' + test_lat + '&lon=' + test_long + '&radius=1&format=json&nojsoncallback=1';
    var mapsApi = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.id + '&key=' + mapsApiKey;

    var googleImgsApi = [];
    //https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-35.1522,150.7027&radius=1000&key=AIzaSyDydgd2jbeRErhSowqagqkqVqARAPUieAw
    //http request here
   //https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=CnRtAAAATLZNl354RwP_9UKbQ_5Psy40texXePv4oAlgP4qNEkdIrkyse7rPXYGd9D_Uj1rVsQdWT4oRz4QrYAJNpFX7rzqqMlZw2h2E2y5IKMUZ7ouD_SlcHxYq1yL4KbKUv3qtWgTK0A6QbGh87GB3sscrHRIQiG2RrmU_jF4tENr9wGS_YxoUSSDrYjWmrNfeEHSGSc3FyhNLlBU&key=AIzaSyDydgd2jbeRErhSowqagqkqVqARAPUieAw

    //might use async package for multiple request
    //http://stackoverflow.com/questions/34436455/calling-multiple-http-requests-in-a-single-http-request-in-node-js

    //debugging statement:
    // console.log("the json request url:" + fiveDayWeatherApi);

    request({
        url: fiveDayWeatherApi,
        json: true
    }, function(error, response, weather5) {
        if (!error && response.statusCode == 200) {
            //more debugging
            //console.log(weather5);
            //check length here
            //console.log("length of the array is here: "+weather5.list.length);
            for (i = 3; i < weather5.list.length; i += 8) {
                //2016-10-11 12:00:00
                // sets the day of the week from a number returned by getday function
                var weekday = new Array(7);
                weekday[0]=  "Sun";
                weekday[1] = "Mon";
                weekday[2] = "Tue";
                weekday[3] = "Wed";
                weekday[4] = "Thu";
                weekday[5] = "Fri";
                weekday[6] = "Sat";

                //obtaining day from time retrieved from weather api
                var t = weather5.list[i].dt_txt;
                //var t = new Date();
                var day = weekday[new Date(t).getDay()];
                //fixing icon from night to all day
                var oldicon = weather5.list[i].weather[0].icon;
                oldicon = oldicon.replace("n","d");
                var date = {
                    time: day,
                    weather: weather5.list[i].weather[0].description,
                    temp: weather5.list[i].main.temp,
                    humidity: weather5.list[i].main.humidity,
                    windSpeed: weather5.list[i].wind.speed,
                    icon: oldicon,
                }
                //console.log("array check :"+ i);
                // fiveDayWeather.push('Date:' + weather5.list[i].dt_txt +
                //     'Weather description:' + weather5.list[i].weather[0].description +
                //     'temp_min:' +
                //     weather5.list[i].main.temp_min + '  temp_max:' +
                //     weather5.list[i].main.temp_max + '  humidity:' +
                //     weather5.list[i].main.humidity + '%  wind speed:' +
                //     weather5.list[i].wind.speed + 'm/s'); // more debugging statements+ '        zzzzzzz:' + weather5.list[i].dt_txt);

                fiveDayWeather.push(date);
            }
        }
    });

    request({
        url: mapsApi,
        json: true
    }, function(error, response, place) {
        if (!error && response.statusCode == 200) {
            placeDetails.name = place.result.name;
            placeDetails.address = place.result.formatted_address;
            if (place.result.formatted_phone_number)
                placeDetails.phone = place.result.formatted_phone_number;
            else
                placeDetails.phone = "N/A";
            if (place.result.opening_hours)
                placeDetails.openingHours = place.result.opening_hours.weekday_text;
            if (place.result.rating)
                placeDetails.rating = (Math.round(place.result.rating*2)/2)*20;
            else
                placeDetails.rating = 0;
            if (place.result.website)
                placeDetails.website = place.result.website;
            else
                placeDetails.website = "N/A";

            // Place photos
            if (place.result.photos) {
                console.log(place.result.photos[0].getUrl);
                for (var i = 0; i < place.result.photos.length; i++) {
                    var photoRef = place.result.photos[i].photo_reference;
                    var height = place.result.photos[i].height;
                    googleImgsApi.push("https://maps.googleapis.com/maps/api/place/photo?" +
                    "photoreference=" + photoRef + "&maxheight=" + height +
                    "&key=" + mapsApiKey);
                    // console.log(googleImgsApi);
                }
            }

            request({
                url: weatherApi,
                json: true
            }, function(error, response, weather) {
                if (!error && response.statusCode == 200) {
                    // console.log(placeDetails);
                    res.render('campsites', {
                        //used for google maps
                        place: placeDetails,
                        place_condition: weather.weather[0].description,
                        place_temp: weather.main.temp,
                        place_wind_speed: weather.wind.speed,
                        place_5day_weather: fiveDayWeather,
                        header_image: placeImages[0],
                        place_images: placeImages,
                        place_icon: weather.weather[0].icon,
                        place_lat: test_lat,
                        place_lng: test_long,
                        place_id: req.query.id,
                        //place_chance: weather.precipitation.value,
                        partials: {
                            header: 'partials/header',
                            navbar: 'partials/navbar',
                            bottomJs: 'partials/bottomJs',
                            API_KEY: 'partials/api_key'
                        }
                    });
                } else {
                    console.log("Nothing works");
                }
            });
        }
    })

    // request({
    //     url: flickrApi,
    //     json: true
    // }, function(error, response, imgs) {
    //     if (!error && response.statusCode == 200) {
    //         //console.log(imgs.photos.photo[0]);
    //
    //         if (imgs.photos.photo.length != 0){
    //             for (i = 0; i < 20; i++) {
    //                 if (i === imgs.photos.photo.length) {
    //                     break;
    //                 }
    //
    //                 // placeImages += '<br>https://farm' + imgs.photos.photo[i].farm +
    //                 //     '.staticflickr.com/' + imgs.photos.photo[i].server +
    //                 //     '/' + imgs.photos.photo[i].id + '_' +
    //                 //     imgs.photos.photo[i].secret + '.jpg</br>';
    //                 //
    //                 // placeImages += '<br>https://www.flickr.com/photos/' +
    //                 //     imgs.photos.photo[i].owner + '/' +
    //                 //     imgs.photos.photo[i].id + '</br>';
    //
    //                 // _h gives us the largest resolution possible
    //                 var imgUrl =  'https://farm' + imgs.photos.photo[i].farm +
    //                 '.staticflickr.com/' + imgs.photos.photo[i].server +
    //                 '/' + imgs.photos.photo[i].id + '_' +
    //                 imgs.photos.photo[i].secret + '_h.jpg';
    //                 placeImages.push(imgUrl);
    //                 console.log("[" + i + "]: " + placeImages[i]);
    //             }
    //         }else {
    //             //or else internet meme
    //             placeImages.push('https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSVWU-oMzxvDFu35Ky6uWAn63fqbu2DagpEBtOnFPkC6RAa30wmSg');
    //         }
    //     }
    // });
});


module.exports = router;
