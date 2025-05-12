
if ("geolocation" in navigator){
    console.log("Geolocation is available");
} else {
    console.log("Geolocation is not available");
}

function success(position) {
    console.log(position)
    //document.querySelectorAll("#location").innerHTML = position;
}
navigator.geolocation.getCurrentPosition(success);

document.querySelectorAll("#location").innerHTML = "test message";