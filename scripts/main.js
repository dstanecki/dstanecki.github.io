var request = new XMLHttpRequest()

request.onload = function () {
    
}

request.send()

request.open('GET', 'https://61jjt72rgl.execute-api.us-east-1.amazonaws.com/incrementVisitorCount', true)

let data = await response.json()

document.getElementById("visitors").innerHTML = data['count'] + " visits.";

console.log(data)

return data;
