---
layout: post
title:  "Bootstrapping MariaDB in Kubernetes with ConfigMaps and initContainers"
date:   2025-06-22 00:00:00 -0500
categories: projects
---
While replatforming my [zillow-housing-forecast](https://github.com/dstanecki/zillow-housing-forecast/){:target="_blank"} project to Kubernetes, I needed to find the most effective way to initialize my mariadb SQL database. I preferred to mount the files as volumes rather than bake it into the container because I wanted to have the flexibility to edit my files without rebuilding a container. This is the approach I used when the app was just docker-compose. However, accomplishing the same in Kubernetes posed some unique challenges, especially because I needed to combine a small SQL script with a large dataset and inject both into a MariaDB pod on startup.<!--break-->

#### **Overview**

In the application database, the data is imported from a dataset that's updated monthly by Zillow. The front-end users are not manipulating the data in any way. This lets me use the stock mariadb container and simply re-initialize and populate the SQL database each time a new mariadb pod is deployed. To accomplish that, I had to find the best way to get my import-data.sql script and my data.csv file inside the /docker-entrypoint-initdb.d directory. 

Option A: I could curl both files from github to an initContainer and have them mounted to the db container. 

Option B: I could see if I can mount them locally using k8s manifests (would avoid having external dependency on Git, extra curl download times, etc.)

I ultimately chose Option B for the script (ConfigMap) and Option A for the dataset (curl) because ConfigMaps are easy to manage for small files and more reliable than pulling over the network, while the dataset exceeded the 1MiB limit.

#### **ConfigMap**

ConfigMap to mount script: 
```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: dbcreation-script
  namespace: zhf
data: 
  import-data.sql: |-
    CREATE DATABASE IF NOT EXISTS ZillowHomeValueForecast;
    USE ZillowHomeValueForecast;

    CREATE TABLE forecast (
        RegionID INT,
        SizeRank INT,
        RegionName VARCHAR(50),
        RegionType VARCHAR(50),
        StateName VARCHAR(50),
        St VARCHAR(50),
        City VARCHAR(50),
        Metro VARCHAR(50),
        CountyName VARCHAR(50),
        BaseDate DATE,
        `2025-06-30` DECIMAL(4, 2),
        `2025-08-31` DECIMAL(4, 2),
        `2026-05-31` DECIMAL(4, 2)
    );

    LOAD DATA LOCAL INFILE '/docker-entrypoint-initdb.d/data.csv'
    INTO TABLE forecast
    FIELDS TERMINATED BY ','
    ENCLOSED BY '"'
    LINES TERMINATED BY '\n'
    IGNORE 1 ROWS;
```

#### **Deployment**
Mariadb Deployment file: for the time being I'm curling the data.csv using an initContainer but I'm also mounting the script by way of configMap. The initContainer downloads the data and copies the SQL script into an emptyDir shared volume. That volume is then mounted to the mariadb container's /docker-entrypoint-initdb.d, allowing both files to be picked up during container initialization.
```bash
...
    spec:
      initContainers: 
        - name: download-csv
          image: curlimages/curl:latest 
          command:
            - sh
            - -c
            - |
              curl -L https://raw.githubusercontent.com/dstanecki/zillow-housing-forecast/refs/heads/main/data/data.csv -o /csv/data.csv
              cp /config/import-data.sql /csv/import-data.sql
          volumeMounts:
            - name: csv-data
              mountPath: /csv
            - name: dbcreation-script 
              mountPath: /config
      containers:
        - env:
            - name: MYSQL_DATABASE
              value: ZillowHomeValueForecast
            - name: MYSQL_ROOT_PASSWORD
              value: <password>
          image: mariadb:latest
          name: mariadb
          ports:
            - containerPort: 3306
              protocol: TCP
          volumeMounts:
            - mountPath: /var/lib/mysql
              name: mariadb-data
            - mountPath: /docker-entrypoint-initdb.d
              name: csv-data
      restartPolicy: Always
      volumes:
        - name: mariadb-data
          persistentVolumeClaim:
            claimName: mariadb-data
        - name: dbcreation-script
          configMap:
            name: dbcreation-script
        - name: csv-data
          emptyDir: {}
```


#### **Final Thoughts**

This was a good exercise for learning about configMaps and volumes in Kubernetes. In the future, I might explore mounting the dataset from a persistent volume to remove the GitHub dependency altogether.

**Update: I eventually decided that baking the files in a custom mariadb container was the best use case for me.