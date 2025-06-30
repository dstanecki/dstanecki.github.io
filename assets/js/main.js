var request = new XMLHttpRequest();

request.open('GET', 'https://34duefjt7f.execute-api.us-east-1.amazonaws.com/serverless_lambda_stage', true);

request.onload = function () {
  var data = JSON.parse(this.response); // Parse API response

  if (request.status >= 200 && request.status < 400) {
    document.getElementById("visitors").innerHTML = data['count'] + " visits";
    console.log(data);
  } else {
    console.log('error');
  }
};

request.send();
