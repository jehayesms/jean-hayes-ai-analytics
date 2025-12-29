---
layout: default
title: "Microsoft Fabric Capacity and Workspace Design"
subtitle: "Capacity and Workspace Design for performance, scalability, security and governance"
date: 2025-10-21
categories: [Microsoft Fabric]
image: /assets/images/fabric-cap-ws/fabric-cap-ws-01.png
image_caption: ""
---


Starting up in Microsoft Fabric is easy, right? Create a Fabric Capacity, create a workspace and just start building. While this may be true for small scale deployments, as your organization grows and more users start to leverage Fabric, you may outgrow your initial design. Having a thorough understanding of Fabric capacities and workspaces and your current and future goals for data, analytics and AI is essential to design a scalable and performant environment. 

Capacity and workspace design:

- Must support **organizational growth** and **changing requirements**
- Impacts Fabric workload and Power BI report **performance** by enabling better resource allocation and utilization
- Provides more options for **scalability** -> Scale up vs Scale out
- Facilitates **collaboration, data governance, and integration** with other systems and services
- Affects **security** and **permissions management**
- Is integral in **CI/CD** and **DevOps** practices
- Enables better **cost management**
  
In this blog, we will:

- review **Fabric capacity and workspace concepts** and considerations for designing a **scalable, performant, and secure environment**
- cover **key questions**  to pose around your **current and future requirements, personas, and CI/CD practices**
- review typical **architectural patterns** for Fabric capacities and workspaces

With this knowledge, you will be better equipped to design a Fabric environment that meets your organization's needs both now and in the future.

# **Fabric Capacity Consumption**

Fabric Capacities are the backbone of resource allocation in Microsoft Fabric. They provide dedicated resources for hosting and running workloads, ensuring optimal performance and reliability. All Fabric items on a single capacity share the compute. For example, if a Fabric pipeline calls a SQL script in a Data Warehouse on the same capacity, both the script consume compute from that single capacity. If performance was slow on the SQL script, you may need scale up or scale out the capacity. In contrast, if an Azure Data Factory pipeline calls an Azure SQL DB script, the pipeline would use an Azure Integration Runtime compute for pipeline activities and the Azure SQL DB compute for SQL script execution. For performance issues with Azure SQL DB, you would just scale up the compute for a single resource, the Azure SQL DB.

The key for optimizing Fabric capacity cost and performance is to find the "sweet spot" where workload needs are met without throttling or being underutilized.

- Size capacities to meet the needs of normal operations and understand how to handle peak loads.
  - [Bursting and smoothing](https://learn.microsoft.com/en-us/fabric/enterprise/throttling) allows capacities to keep running workloads when temporary spikes occur rather than failing or slowing down
    - Bursting allows operations to temporarily exceed capacity limits
    - Smoothing evens out capacity resource usage over time without throttling
    - Throttling can occur when workloads exceed capacity limits for extended periods and could eventually lead to request rejections
  - [Surge protection](https://learn.microsoft.com/en-us/fabric/enterprise/surge-protection) can be turned on to prevent sudden spikes from overwhelming the capacity and reduces the risk of throttling
  - [Autoscale for Spark](https://learn.microsoft.com/en-us/fabric/data-engineering/autoscale-billing-for-spark-overview) allows you to run Spark workloads on a pool outside of the Fabric capacity, removing that workload from the Fabric capacity
- Consider how different workloads on the same capacity will impact each other. Most Fabric items can work across workspaces
- Fabric Capacity reservations save costs for long-term usage compared to pay-as-you-go pricing. Reservations can also be split or consolidated across multiple capacities. For example, an F128 SKU reservation can be used for a single capacity or split into two F64 SKUs or 1 F64, 1 F32, and 2 F16s or even an F120 and an F8. This provides flexibility in managing capacity resources as organizational needs evolve. But before you purchase a reservation, be sure to analyze your current and projected usage to determine the appropriate size and duration of the reservation.
- Optimize all workloads including semantic model design and use built in features like the [Native Execution Engine (NEE) for Data Engineering](https://learn.microsoft.com/en-us/fabric/data-engineering/native-execution-engine-overview?tabs=sparksql)
- Consider timing on workloads
  - For example, if pipelines run only in off hours, having semantic models on the same capacity may not be an issue. However, if pipelines run during business hours, they may impact report performance
  - Even if the workloads reside on the same capacity for starters, still consider future needs and design workspaces accordingly so that workloads can be moved to a different capacity if needed (more on that later)
- Monitor capacity usage and performance regularly to identify bottlenecks and optimize resource allocation
  - Use [Capacity Metrics in the Fabric Admin Portal](https://learn.microsoft.com/en-us/fabric/enterprise/capacity-metrics) to monitor usage and performance
  - Set up alerts for high usage or performance issues to proactively manage capacity resources

The goal is for the capacity to be less than 80% utilized but to not be underutilized either.

Additionally, like other Fabric resources, Fabric Capacities can be tagged for cost allocation and tracking. If different departments need to account for their Fabric costs separately, setting up separate capacities and tagging them appropriately can simplify [cost management](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-allocation-introduction#tags).

Check the [Fabric Roadmap](https://roadmap.fabric.microsoft.com/?product=administration%2Cgovernanceandsecurity) frequently for upcoming features that may impact capacity management, such as Fabric capacity overage billing, due for public preview in Q1 2026.

# **Workspace Design Considerations**

![Fabric Deployment Pipelines Overview]( {{"assets/images/fabric-cap-ws/fabric-cap-ws-03.png"| relative_url}} )

Workspaces in Microsoft Fabric are logical containers for organizing and managing your data, analytics, and AI assets. They provide a way to group related items together, control access and permissions, and facilitate collaboration among team members. When designing workspaces, consider the following:

- Workspaces can easily be moved between capacities **in the same region**
  - So though you may start with a single capacity, consider organizing your Fabric items in different workspaces that may benefit from running on a separate capacity in the future. One example is putting reports and semantic models in separate workspace(s) than pipelines and Spark jobs, especially if the pipelines and Spark jobs are resource intensive and/or run during business hours
  - If you need to support multi-regions, you will need separate capacities and workspaces in each region. You cannot simply move a workspace to a capacity in a different region - you would need to recreate the workspace and its contents in the new region
- Limit access to workspaces
  - Use Power BI Apps to share reports and dashboards without giving report consumers access to the workspace itself
  - Assign item level access to Fabric items such as a Lakehouse or Semantic model rather than giving users access to the entire workspace
    - Segregating Fabric items into different workspaces based upon access needs can simplify security and governance; For example, creating a workspace for power users to build their own reports over semantic models from a governed workspace
  - Read more about [OneLake and Fabric security](https://learn.microsoft.com/en-us/fabric/onelake/security/get-started-security) here
- Consider the impact of workspace design on CI/CD and DevOps practices
  - Git repos are at the workspace level
  - Workspaces can be used to separate development, testing, and production environments
  ![Fabric Deployment Pipelines Overview]( {{"assets/images/fabric-cap-ws/fabric-cap-ws-10.png"| relative_url}} )
  - Use deployment pipelines to automate the deployment of items between workspaces
  - Leverage variable libraries to manage environment-specific settings such as connection strings

So as we move on to the next section, reviewing your current and future requirements, keep in mind the considerations above around capacity consumption and workspace capabilities.

# **Discover Current and Future Fabric Requirements**

Before designing your Fabric capacities and workspaces, it's essential to understand your organization's current and future needs. We'll cover key questions to ask around:

- Current Business Use Cases and Fabric Environment
- Future Goals for Fabric
- Personas using Fabric
- CI/CD Environment
- Current and Future Data Architectures

## **Fabric Today**

### What you are doing in Microsoft Fabric today?

- What are current business use cases?
- What are your deliverables?
- What are your data sources?
- What are you using for source control and CI/CD?
- Do you have any architecture diagrams? Ensure they are up to date.
- What are your challenges?

### **What Fabric experiences are you using and for what purpose?**

- Power BI reports
- Semantic models – Direct Lake, Import, Direct Query
- Lakehouse
- Data warehouse
- Mirroring
- Pipelines
- Spark
- Event hubs, RTI, KQL
- SQL Database
- Cosmos
- Data Bricks
- AI
- Dataflows
- Copilot
  - Best practice for Copilot is to have a [separate capacity for Copilot workloads](https://learn.microsoft.com/en-us/fabric/enterprise/fabric-copilot-capacity) to avoid impacting other workloads
    - This can be even be an F2 capacity since Copilot uses the capacity where the data resides
    - The Copilot capacity is only used for billing and allows you to control Copilot usage so it does not impact other workloads or cause unexpected costs
- Other

### What is the state of your current capacities?

- What Fabric Capacities do you have now?
- How are workspaces currently aligned?
- Do you have any reservations?
- What workloads are using the most capacity?
- What is your normal capacity utilization?
- Are there any issues with capacity throttling?
- Do you have any surge protection or autoscale enabled?
- How are you monitoring capacity usage and performance?
- How do you anticipate your capacities/workspaces to grow?
- Are there times when the capacities not being used?
- Or are there times when they are in high demand?
- What reports have the most consumption?
- Are there any spark jobs that are resource intensive?

## **Fabric Future**

### What are your goals for the next 6-12 months?

- What are your business use cases you wish to implement in the next 6 months?
  - For each use case, what is the priority and timeline?
- What features are you considering and for what use case? For example…
  - Enterprise Data Warehouse for Reporting
  - Lakehouse For Reporting
  - Lakehouse for Data Science
  - RAG over Power BI Data
  - Integration with Azure AI Foundry
  - Operational Workloads
  - Near-RealTime Reporting
  - Near RealTime Alerting
  - Other

### What are your goals for the beyond 6-12 months?

- What are your business use cases you wish to implement in the next 6 months?
  - For each use case, what is the priority and timeline?
- What features are you considering and for what use case? For example…
  - Enterprise Data Warehouse for Reporting
  - Lakehouse For Reporting
  - Lakehouse for Data Science
  - RAG over Power BI Data
  - Integration with Azure AI Foundry
  - Operational Workloads
  - Near-RealTime Reporting
  - Near RealTime Alerting
  - Other

## What are the personas of those using (or will be using) Fabric?

Note: Best practice is to set up security groups for personas

### Business

- Consumers of Power BI Reports Only
- Business Report Writers
- Super Users
  - Those who create report content, semantic models, query data with SQL, other Fabric experiences
- Executives
- External Users

### IT

- Data engineers
- AI Engineers
- DBAs
- App Dev
- Infra
- IT Managed Report Developers
- Data scientists – consuming data, training

## ** What does your CI/CD environment look like? **

- Do you have a CI/CD environment set up today?
- Are you using Github or Azure DevOps?
- How does or will your IT Team work together?
  - Multiple contributors on single artifact 
  - Multiple contributors on same workspace but different artifacts
- What does or will your environments look like?
  - Dev, Test, Prod
  - Are all workspaces retained in source control?
  - Will users be using CI/CD for reports?
