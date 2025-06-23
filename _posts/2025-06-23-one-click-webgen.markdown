---
layout: post
title:  "One-Click Website Generation using OpenAI, CI/CD, and Terraform"
date:   2025-06-23 01:00:00 -0500
categories: projects
---
I remember when I was in high school English class I had to write about a dream job. I chose to write about web development, but the more I learned about the career path, the more I realized that I didn't want to pursue it. Not because I wouldn't enjoy it, but because the web development field was shrinking and being replaced by Wix, Wordpress, and the like. Over time it became easier for people to create websites themselves, without the need to hire a developer.

Fast forward to 2025, and I've built a project that reflects just how far things have come. Using OpenAI, Terraform, and a CI/CD pipeline, it can deploy a website from user prompts in just 2-3 minutes. Granted, it's rudimentary, consisting of a single-page HTML file, built-in CSS, and an optional AI-generated image, but I think it's a good demonstration of how far technology has come and a taste of what AI could be capable of in the future.<!--break-->

### **How it works**

GitHub repository link: [one-click-webgen](https://github.com/dstanecki/one-click-webgen/){:target="_blank"} 

![one-click-webgen.drawio.png](/assets/one-click-webgen.drawio.png)

- You configure your Azure API credentials and OpenAI API credits ($$)
- You enter a prompt to generate AI art, a prompt to generate the website text content, and a prompt to describe what the visual theme should be.
- GitHub Actions triggers on manual dispatch.
- The pipeline uses the OpenAI API to generate PNG images and HTML docs with internal CSS.
- The generated files are deployed to Azure using Terraform (or optionally GitHub Pages static hosting)
- GitHub Actions outputs the live link

### **Demonstration website generation**

#### User prompt:
![one-click-webgen-user-prompt.png](/assets/one-click-webgen-user-prompt.png)

#### Website link output:
![website-link-output.png](/assets/website-link-output.png)

#### Live Hawaii-themed duck site:
![hawaii-themed-duck-site.png](/assets/hawaii-themed-duck-site.png)

### **Final Thoughts**

I had a lot of fun building this and intend to keep up with the development of ChatGPT.