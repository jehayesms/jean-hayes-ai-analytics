---
layout: default
title: "Microsoft Fabric Capacity and Workspace Design"
subtitle: "Design for performance and scalability"
date: 2025-10-21
categories: [Microsoft Fabric]
image: /assets/images/fabric-cap-ws/fabric-cap-ws-01.png
image_caption: ""
---

Starting up in Microsoft Fabric is easy, right? Create a Fabric Capacity, create a workspace and just start building. While this may be true for small scale deployments, as your organization grows and more users start to leverage Fabric, you may outgrow your initial design. Having a thorough understanding of Fabric capacities and workspaces and your current and future goals for data, analytics and AI is essential to design a scalable and performant environment. 

Capacity and workspace design:

- Must support organizational growth and changing requirements
- Impacts Fabric workload and Power BI report performance by enabling better resource allocation and utilization
- Provides more options for scalability -> Scale up vs Scale out
- Facilitates collaboration, data governance, and integration with other systems and services
- Affects security and permissions management
- Is integral in CI/CD and DevOps practices
- Enables better cost management

- Supports multi-region deployments for global organizations
  
In this blog, we will:

- review Fabric capacity and workspace concepts and considerations for designing a scalable, performant, and secure environment
- cover key questions you need to pose around your current and future requirements, personas, and CI/CD practices
- review typical architectural patterns for Fabric capacities and workspaces

With this knowledge, you will be better equipped to design a Fabric environment that meets your organization's needs both now and in the future.

## Fabric Capacity Consumption

Fabric Capacities are the backbone of resource allocation in Microsoft Fabric. They provide dedicated resources for hosting and running workloads, ensuring optimal performance and reliability. All Fabric items on a single capacity share the capacity compute. For example, if a Fabric Pipeline calls a SQL script in a Data Warehouse on the same capacity, both the script consume compute from that single capacity. If performance was slow on the SQL script, you may need scale up or scale out the capacity. In contrast, if an Azure Data Factory pipeline calls an Azure SQL DB script, the pipeline would use an Azure Integration Runtime compute for Pipeline activities and the Azure SQL DB compute for SQL script execution. For performance issues with Azure SQL DB, you would just scale up the compute for a single resource, the Azure SQL DB.

The key for optimizing capacity cost and performance is to find the "sweet spot" where workload needs are met without throttling or being underutilized.

- Size capacities to meet the needs of normal operations and understand how to handle peak loads.
  - [Bursting and smoothing](https://learn.microsoft.com/en-us/fabric/enterprise/throttling) allows capacities to keep running workloads when temporary spikes occur rather than failing or slowing down
    - Bursting allows operations to temporarily exceed capacity limits
    - Smoothing evens out capacity resource usage over time without throttling
    - Throttling can occur when workloads exceed capacity limits for extended periods and could eventually lead to request rejections
  - [Surge protection](https://learn.microsoft.com/en-us/fabric/enterprise/surge-protection) can be turned on to prevent sudden spikes from overwhelming the capacity and reduces the risk of throttling
  - [Autoscale for Spark](https://learn.microsoft.com/en-us/fabric/data-engineering/autoscale-billing-for-spark-overview) allows you to run Spark workloads on a pool outside of the Fabric capacity, removing that workload from the Fabric capacity
- Consider how different workloads on the same capacity will impact each other. Most Fabric items can work across workspaces
- Fabric Capacity reservations save costs for long-term usage compared to pay-as-you-go pricing. Reservations can also be split or consolidated across multiple capacities. For example, an F128 SKU reservation can be used for a single capacity or split into two F64 SKUs or 1 FF64, 1 F32, 2 F16s or even F120 and an F8. This provides flexibility in managing capacity resources as organizational needs evolve.
- Be sure to optimize all workloads including semantic model design and use built in features like the [Native Execution Engine (NEE) for Data Engineering](https://learn.microsoft.com/en-us/fabric/data-engineering/native-execution-engine-overview?tabs=sparksql)
- Consider timing on workloads
  - For example, if pipelines run only in off hours, having semantic models on the same capacity may not be an issue. However, if pipelines run during business hours, they may impact report performance
- Monitor capacity usage and performance regularly to identify bottlenecks and optimize resource allocation
  - Use [Capacity Metrics in the Fabric Admin Portal](https://learn.microsoft.com/en-us/fabric/enterprise/capacity-metrics) to monitor usage and performance
  - Set up alerts for high usage or performance issues to proactively manage capacity resources

The goal is to for the capacity to be less than 80% utilized but to not be underutilized either.

Check the [Fabric Roadmap](https://roadmap.fabric.microsoft.com/?product=administration%2Cgovernanceandsecurity) frequently for upcoming features that may impact capacity management, such as Fabric capacity overage billing, due for public preview in Q1 2026.

## Workspace Design Considerations
Workspaces in Microsoft Fabric are logical containers for organizing and managing your data, analytics, and AI assets. They provide a way to group related items together, control access and permissions, and facilitate collaboration among team members. When designing workspaces, consider the following:

- Workspaces can easily be moved between capacities **in the same region**
  - So even though you may start with a single capacity, consider organizing your workloads into workspaces that may benefit from running on a new capacity in the future. A great example is having reports and semantic models in separate workspaces, both for performance, security, and data governance
  - If you need to support multi-regions, you will need separate capacities and workspaces in each region. You cannot simply move a workspace to a capacity in a different region - you would need to recreate the workspace and its contents in the new region
- Limit access to given workspaces
  - Use Power BI Apps to share reports and dashboards without giving them access to the workspace itself
  - Assign item level access to Fabric items such as a Lakehouse or Semantic model rather than giving access to the entire workspace
- Consider the impact of workspace design on CI/CD and DevOps practices
  - Git repos are at the workspace level
  - Workspaces can be used to separate development, testing, and production environments
  - Use deployment pipelines to automate the deployment of items between workspaces
    - Leverage variable libraries to manage environment-specific settings such as connection strings
![Fabric Deployment Pipelines Overview]( {{"assets/images/fabric-cap-ws/fabric-cap-ws-10.png"| relative_url}} )
