---
layout: post
title:  "Building a Serverless Web Application"
date:   2021-10-27 21:46:57 -0500
categories: projects
---
The goal of this project was to create a web application that has a user management system, serverless backend, and RESTful API. The project utilizes AWS Lambda, Amazon API Gateway, AWS Amplify, Amazon DynamoDB, and Amazon Cognito. I followed the hands-on tutorial provided by AWS [here](https://aws.amazon.com/getting-started/hands-on/build-serverless-web-app-lambda-apigateway-s3-dynamodb-cognito/){:target="_blank"}.<!--break-->

### **Hosting a Static Website**

I began by creating a CodeCommit repository, setting up my IAM account with Git credentials, and populated the Git repository with website content provided by Amazon. The content consists of HTML, CSS, and JavaScript files that form a website called WildRydes that's made to look like a ride sharing site, but instead of cars it's unicorns. So after I hosted my repository using Amplify, the resulting index page was this: 

![IndexPage](/assets/indexPage.png)

### **User Management**

I created an Amazon Cognito User Pool and filled the web site's JavaScript configuration file with my user pool ID, app client ID and Region. I was then able to sign up for an account through the website, confirm it with an email code, and verify that it was confirmed in my User Pool dashboard. 

### **Building a Serverless Backend**

I created a DynamoDB table to hold Strings. I also created a Lambda function using JavaScript code provided by Amazon, which would be used to process API requests from users on the web site. The function needed access to the DynamoDB table so I created an IAM Role to allow for this. I attached the AWSLambdaBasicExecutionRole permission to it, as well as added an inline policy to allow for the action: PutItem. 

### **Deploying a RESTful API**

I created a REST API and a Cognito User Pools Authorizer. After signing in to the website, I received an auth token and tested my authorizer successfully (received response code 200). Here's what that looked like:

![SuccessfulAuthorizerTest](/assets/successfulAuthorizerTest.png)

Then I created a resource in my API with a POST method (request method supported by HTTP), and integrated my Lambda function into it. Also, I added my user pool authorizer to the method request portion of the POST method, and deployed my API. 

The last thing to do was test the final product on the web site. At this point I was receiving an error message saying that there was no API invoke configured in /js/config.js, which was strange because I had already added my invoke link there. I figured it was some issue with my API method and it turns out I had forgotten to press the tiny checkbox to confirm my POST method's authorization settings. I fixed that, cleared my cache, tried again, and received the same error message. Then I tried deleting my API stage, making a new one, and redeploying the site on Amplify. Still no luck. 

I confirmed here that the website wasn't recognizing my updated repo on CodeCommit: 

![NoInvokeURL](/assets/noInvokeURL.png)

But on the bright side, I narrowed the problem down to either being a CodeCommit or Amplify issue. So after creating a new Amplify deployment with CodeCommit, the problem resolved itself, and here is the successful product: 

![SuccessfulTest](/assets/successfulTest.png)
