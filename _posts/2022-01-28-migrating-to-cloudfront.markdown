---
layout: post
title:  "Migrating From GitHub Pages to AWS"
date:   2022-01-27 21:46:57 -0500
categories: projects
---
I migrated this site from GitHub Pages to S3 + CloudFront and transferred my DNS name from Namecheap to Route 53. I also added visitor count functionality to the website using API Gateway, Lambda, and DynamoDB (the code can be found here: [https://github.com/dstanecki/website-visitor-count](https://github.com/dstanecki/website-visitor-count){:target="_blank"}).<!--break-->

#### **Migration Process**

I began by uploading my site files from my local directory to a new S3 bucket (the AWS CLI command 'aws s3 sync . s3://(bucket name)' is a cool way to do this). From there I enabled S3 Static Hosting and ensured that the site was functional. I created a CloudFront Distribution set to deliver to North America and EU, set the alternate CNAME records to my custom DNS name, and requested an SSL certificate from ACM. I also created a new Origin Access Identity for the S3 bucket and configured the bucket to block all public access. Finally, I began the process of transferring my domain from Namecheap to Route 53, because why not. 

#### **Adding the Visitor Count**

I wrote a Lambda script that uses Boto3 to increment a DynamoDB table attribute and then return an API response object that consists of the current "visitor_count" value. I attached an API to the function and wrote some JavaScript to interact with the API. [This source](https://www.taniarascia.com/how-to-connect-to-an-api-with-javascript/){:target="_blank"} helped me to write the JavaScript and [this source](https://www.linkedin.com/pulse/how-i-built-my-aws-serverless-website-part-2-shishir-jaiswal/){:target="_blank"} helped me with the Lambda function. The end result looked like this: 
![visitorCountEndResult](/assets/visitorCountEndResult.png)

#### **Final Thoughts**

Adding a visitor counter proved to be the most challenging part of this project but I also learned a lot from it. Other than that, setting up the website hosting on AWS went rather smoothly. At this point in time I'm still waiting for my domain to transfer to Route 53, which can take up to 10 days according to AWS. Once I get that sorted, I'll modify my DNS name to point to my CloudFront distribution with the visitor count, rather than to my GitHub Pages site.
