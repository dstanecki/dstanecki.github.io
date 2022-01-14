---
layout: post
title:  "Automated Duplication of an RDS Database Cross-Region Using Lambda, EventBridge, and SNS"
date:   2022-01-13 21:46:57 -0500
categories: projects
---
I saw a contractual job listing asking for some Lambda functions to interact with RDS. Though the job listing was outdated, I still wanted to prove to myself that I could do it. My Lambda scripts written in Python (Boto3) are located here: [https://github.com/dstanecki/automated-duplication-of-rds-db-cross-region](https://github.com/dstanecki/automated-duplication-of-rds-db-cross-region){:target="_blank"}<!--break-->

### **About the Job**

The task was exactly as follows: There are two RDS PostgreSQL instances named 'x' and 'y', located in different regions. Lambda should delete 'y' and create another database with the same name 'y' again from the latest 'x' snapshot. No other details were provided, so I tried to come up with the best solution possible. 

### **Setting Up**

To start, I created an RDS database 'x' in us-east-1 and a database 'y' in us-west-2. I set up 'x' to have automated snapshots. I was able to find a blog to point me in the right direction, located [here](https://aws.amazon.com/blogs/database/schedule-amazon-rds-stop-and-start-using-aws-lambda/){:target="_blank"}. 

This particular web server uses Linux, Apache, MariaDB, and PHP. AWS provides a convenient automation document found [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-lamp-amazon-linux-2.html){:target="_blank"}. The installation took no time at all. The configuration was another story. It took me a while to figure out the login credentials for PHP MyAdmin, but after reading the fine lines I discovered that the root password (which is randomized) was automatically stored within the Systems Manager Parameter Store. Since phpMyAdmin was not yet configured, any attempts to log in with the newfound credentials were met with an error. 
