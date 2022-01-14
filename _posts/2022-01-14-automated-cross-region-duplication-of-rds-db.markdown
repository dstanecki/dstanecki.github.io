---
layout: post
title:  "Automated Cross-Region Duplication of an RDS Database Using Lambda, EventBridge, and SNS"
date:   2022-01-13 21:46:57 -0500
categories: projects
---
I saw a contract job listing asking for some Lambda functions to interact with RDS. Though the listing was outdated, I still wanted to prove to myself that I could do it. My Lambda scripts, written in Python (Boto3), are located here: [https://github.com/dstanecki/automated-cross-region-duplication-of-rds-db](https://github.com/dstanecki/automated-cross-region-duplication-of-rds-db){:target="_blank"}<!--break-->

### **About the Job**

The task was exactly as follows: There are two RDS PostgreSQL instances named 'x' and 'y', located in different regions. Lambda should delete 'y' and create another database with the same name 'y' again from the latest 'x' snapshot. No other details were provided, so I tried to come up with the best solution possible. 

### **Setting Up**

To start, I created an RDS database 'x' in us-east-1 and a database 'y' in us-west-2. I set up 'x' to have automated snapshots. Something I learned here was that backup snapshots only exist in a single region unless you enable cross-region replication for another region, so I enabled that as well. 

I was able to find a blog (written by Yesh Tanamala, Sharath Lingareddy, and Varun Mahajan) to point me in the right direction, located [here](https://aws.amazon.com/blogs/database/schedule-amazon-rds-stop-and-start-using-aws-lambda/){:target="_blank"}. I also pulled up the RDS actions documentation [here](https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonrds.html){:target="_blank"}. The next thing to do was create an IAM policy using a template from the AWS blog. I had to add some extra action permissions to the policy: rds:DeleteDBInstance and rds:RestoreDBInstanceFromDBSnapshot. Later on I would also add rds:AddTagsToResource and rds:DescribeDBSnapshots. 

### **Writing and Testing the Lambda Functions**

I created an IAM role using this policy and attached the role to Lambda. The blog on AWS provided a python Lambda function to stop a database instance, but not delete. As such I modified the function to allow for this, and named it rdsDelete. The [Boto3 RDS Docs](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/rds.html){:target="_blank"} were very handy here. It should be noted that the original function includes capabilities to alter DB clusters, which I left in, but overall this project is only designed to work with DB instances. 

Moving on, I configured the function's environment variables (KEY, REGION, VALUE) to match my 'y' database. After some tinkering, I got the code working. Testing the function would successfully delete database 'y' in us-west-2. 

The next task was to restore the now-deleted 'y' database from the latest 'x' snapshot. I began by writing code that would simply restore the database from a snapshot of my choosing. I named the function rdsRestore and added the appropriate Boto3 methods and parameters. The function actually exceeded the default task timeout time of 3 seconds by a hair, so after I increased it the script ran successfully. 

The biggest problem I faced was figuring out how to point to the identifier of **only the most recent** 'x' database snapshot. I wanted this function to be as automated as possible, and thus not require the user to have to manually enter the snapshot identifier. Dozens of StackOverflow tabs later, I was able to figure this one out. 

### **Implementing EventBridge and SNS**

Next, I wanted to automate the Lambda functions to run. I ended up using an EventBridge rule that would trigger once a day always at the same time. I set my rdsDelete function as a target for this rule. I thought about creating another rule for my rdsRestore function and running it ~20 minutes later, after the deletion had been finalized, but this wouldn't have been ideal. My end goal was to minimize the downtime of the 'y' database while it updates, and this goal required me to find a solution that would run rdsRestore **directly** after the deletion of the database.

The solution I implemented was creating an SNS topic named 'TriggerRDSAutoRestore' which subscribed to my rdsRestore Lambda function. Then I created an RDS Event Subscription and configured it to send notifications to the SNS topic whenever a deletion of database 'y' occurred. After successful testing, this concluded the project.

### **The Final Product**

The database instance 'x', located in us-east-1, takes automated snapshots and shares them cross-region to us-west-2. Once a day (or however often the user wants), the database instance 'y', located in us-west-2, is automatically deleted. Right after 'y' is deleted, an RDS Event Subscription notifies an SNS topic which triggers the rdsRestore function. The function automatically creates a new database 'y' in us-west-2 from the latest 'x' database snapshot.

### **Final Thoughts**

This project was a great learning experience consisting of lots of trial and error. It was my first time using Lambda in an applicable way, and it's given me confidence to continue learning hands-on by "going in blind" so to speak. 
