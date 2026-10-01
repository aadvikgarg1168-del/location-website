const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = 3000;

app.use(express.json());

const requests = new Map();


// ============================
// HOME PAGE
// ============================

app.get("/", (req, res) => {

res.send(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Location Sharing</title>

<style>

body {
    font-family: Arial;
    background: linear-gradient(135deg,#667eea,#764ba2);
    min-height:100vh;
    margin:0;

    display:flex;
    justify-content:center;
    align-items:center;
}

.box {

    background:white;

    width:90%;
    max-width:450px;

    padding:30px;

    border-radius:20px;

    box-shadow:0 10px 40px #0003;

    text-align:center;
}

h1 {
    margin-top:0;
}

button {

    width:100%;

    padding:15px;

    border:0;

    border-radius:10px;

    background:#4f46e5;

    color:white;

    font-size:17px;

    cursor:pointer;

}

button:hover {
    background:#4338ca;
}

input {

    width:100%;

    box-sizing:border-box;

    padding:14px;

    margin:15px 0;

    border:1px solid #ccc;

    border-radius:10px;

}

#linkBox {

    margin-top:20px;

    display:none;

}

#link {

    width:100%;

    box-sizing:border-box;

    padding:10px;

    margin-top:10px;

}

#location {

    display:none;

    margin-top:20px;

    padding:15px;

    background:#f1f5f9;

    border-radius:10px;

}

</style>

</head>


<body>


<div class="box">

<h1>📍 Location Sharing</h1>

<p>
Create a consent link to test location sharing.
</p>


<button onclick="createLink()">

Generate Location Link

</button>


<div id="linkBox">

<p>
Send this link to the person who wants to share their location:
</p>

<input id="link" readonly>

<button onclick="copyLink()">

Copy Link

</button>

</div>


<div id="status"></div>


<div id="location">

<h3>📍 Location Received</h3>

<p id="coordinates"></p>

<a id="map"
target="_blank">

Open Location in Google Maps

</a>

</div>


</div>


<script>


let token = null;

let timer = null;


async function createLink() {


    const response =
        await fetch("/create");


    const data =
        await response.json();


    token =
        data.token;


    document.getElementById(
        "link"
    ).value =
        data.link;


    document.getElementById(
        "linkBox"
    ).style.display =
        "block";


    document.getElementById(
        "status"
    ).innerHTML =
        "⏳ Waiting for location permission...";


    timer =
        setInterval(checkLocation,3000);

}


function copyLink() {


    const input =
        document.getElementById("link");


    navigator.clipboard.writeText(
        input.value
    );


    document.getElementById(
        "status"
    ).innerHTML =
        "✅ Link copied!";


}


async function checkLocation() {


    if (!token)
        return;


    const response =
        await fetch(
            "/location/" + token
        );


    const data =
        await response.json();


    if (
        data.consentGiven &&
        data.location
    ) {


        clearInterval(timer);


        const latitude =
            data.location.latitude;


        const longitude =
            data.location.longitude;


        document.getElementById(
            "status"
        ).innerHTML =
            "✅ Location received!";


        document.getElementById(
            "coordinates"
        ).innerHTML =

            "Latitude: " +
            latitude +
            "<br>" +

            "Longitude: " +
            longitude;


        document.getElementById(
            "map"
        ).href =

            "https://www.google.com/maps?q=" +
            latitude +
            "," +
            longitude;


        document.getElementById(
            "location"
        ).style.display =
            "block";

    }

}

</script>


</body>

</html>

`);

});


// ============================
// CREATE CONSENT LINK
// ============================

app.get("/create",(req,res) => {


    const token =
        crypto.randomBytes(32).toString("hex");


    requests.set(token,{

        consentGiven:false,

        location:null,

        createdAt:Date.now()

    });


    res.json({

        token:token,

        link:
            `https://location-website.onrender.com/share/${token}`
    

    });

});


// ============================
// CONSENT PAGE
// ============================

app.get("/share/:token",(req,res) => {


    const token =
        req.params.token;


    if (!requests.has(token)) {

        return res.send(
            "<h2>❌ Invalid link</h2>"
        );

    }


    res.send(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width,initial-scale=1.0">

<title>Share Location</title>


<style>

body {

    font-family:Arial;

    background:#f3f4f6;

    min-height:100vh;

    margin:0;

    display:flex;

    justify-content:center;

    align-items:center;

}

.box {

    background:white;

    width:90%;

    max-width:430px;

    padding:30px;

    border-radius:20px;

    text-align:center;

    box-shadow:0 10px 30px #0002;

}

.icon {

    font-size:60px;

}

button {

    width:100%;

    padding:16px;

    border:0;

    border-radius:10px;

    background:#16a34a;

    color:white;

    font-size:17px;

}

#status {

    margin-top:20px;

}

</style>

</head>


<body>


<div class="box">


<div class="icon">
📍
</div>


<h1>
Share Your Location
</h1>


<p>

Your location will only be shared
if you choose to allow it.

</p>


<button onclick="shareLocation()">

Allow & Share My Location

</button>


<div id="status"></div>


</div>


<script>


function shareLocation() {


    const status =
        document.getElementById("status");


    if (!navigator.geolocation) {

        status.innerHTML =
            "❌ Location is not supported.";

        return;

    }


    status.innerHTML =
        "⏳ Requesting permission...";


    navigator.geolocation.getCurrentPosition(

        async function(position) {


            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            const accuracy =
                position.coords.accuracy;


            status.innerHTML =
                "⏳ Sending location...";


            const response =
                await fetch(
                    "/save-location",
                    {

                        method:"POST",

                        headers:{
                            "Content-Type":
                            "application/json"
                        },

                        body:JSON.stringify({

                            token:
                                "${token}",

                            latitude:
                                latitude,

                            longitude:
                                longitude,

                            accuracy:
                                accuracy

                        })

                    }
                );


            if (response.ok) {

                status.innerHTML =
                    "✅ Location shared successfully!";

            }

        },


        function(error) {

            if (error.code === 1) {

                status.innerHTML =
                    "❌ Location permission denied.";

            }

            else {

                status.innerHTML =
                    "❌ Unable to get location.";

            }

        },


        {

            enableHighAccuracy:true,

            timeout:15000,

            maximumAge:0

        }

    );

}

</script>


</body>

</html>

`);

});


// ============================
// SAVE LOCATION
// ============================

app.post("/save-location",(req,res) => {


    const {

        token,
        latitude,
        longitude,
        accuracy

    } = req.body;


    const request =
        requests.get(token);


    if (!request) {

        return res.status(404).json({

            error:"Invalid request"

        });

    }


    request.location = {

        latitude,
        longitude,
        accuracy,

        receivedAt:
            new Date().toISOString()

    };


    request.consentGiven =
        true;


    requests.set(token,request);


    res.json({

        success:true

    });

});


// ============================
// CHECK LOCATION
// ============================

app.get("/location/:token",(req,res) => {


    const request =
        requests.get(
            req.params.token
        );


    if (!request) {

        return res.status(404).json({

            error:"Not found"

        });

    }


    res.json({

        consentGiven:
            request.consentGiven,

        location:
            request.location

    });

});


// ============================
// START
// ============================

app.listen(PORT,() => {

    console.log(
        "Website running at:"
    );

    console.log(
        "http://localhost:" + PORT
    );

});