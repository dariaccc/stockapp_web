
import {API_KEY} from './config.js';
const link = `https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&key=${API_KEY}`

if ("geolocation" in navigator){
    console.log("Geolocation is available");
} else {
    console.log("Geolocation is not available");
}

let lat = ""
let lng = ""

function success(position) {
    console.log(position)
    lat = position.coords.latitude
    lng = position.coords.longitude
    console.log(lat + " " + lng)
    getCountry()
    document.querySelectorAll("#location").innerHTML = position;
}

function error(err) {
    console.error("Geolocation error: ", err);
    locationElement.innerHTML = "Error getting location: " + err.message;
}

function getCountry(){
    fetch(link)

    .then(res => {
        if(res.ok){
            console.log("Success");
            return res.json();
        }
        else{
            console.log("Could not reverse coordinates");
        }
        
    })

    .then(response => {
        console.log(link)
        console.log(response)
    })
    
    .catch(error => console.log(error));

}

navigator.geolocation.getCurrentPosition(success);

document.querySelectorAll("#location").innerHTML = "test message";