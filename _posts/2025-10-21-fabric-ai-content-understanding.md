---
layout: default
title: "From Complex Documents to Actionable Data"
subtile: "Integrating Azure AI Foundry Endpoints with Microsoft Fabric"
date: 2025-10-21
categories: [Azure AI, Fabric]
image: /assets/images/fabric-ai-cu/architecture.png
---

# From Complex Documents to Actionable Data

In [Document Field Extraction with Azure AI Content Understanding](https://jehayesms.github.io/jean-hayes-ai-analytics/azure%20ai/2025/07/22/document-field-extraction-with-azure-ai-content-understanding.html), I illustrated how to use **Azure AI Foundry Content Understanding** to extract data from complex documents using Natural Language Processing. The solution extracted course information from a Community Education course catalog into a table format by describing how to return each field.

In this article, we’ll extend that solution using **Microsoft Fabric**.  
Fabric is ideal because it allows you to:

- Invoke Azure AI endpoints directly from a notebook  
- Store results in a Fabric Lakehouse **without exposing data publicly**  
- Leverage **managed private endpoints** for secure access to Azure resources  
- Build and test a **Fabric Data Agent** without deploying new infrastructure  
- Allow **Power BI Copilot** users and **third-party chat apps** to query the results

You will also learn how to:

- Securely access Azure resources with managed private endpoints  
- Retrieve **Azure Key Vault secrets** within Fabric  
- Use **Variable Libraries** and **Pipeline Parameters** to create reusable assets  
- Call the **Azure AI Content Understanding REST API** from a Fabric notebook  
- Build and publish a **Fabric Data Agent** that integrates with Power BI Copilot  

---

## Azure Content Understanding REST API

Below is an  `curl` syntax to call Azure AI Content Understanding Analyzer:

```bash
curl -i -X POST "{endpoint}/contentunderstanding/analyzers/{analyzerId}:analyze?api-version=2025-05-01-preview" \
  -H "Ocp-Apim-Subscription-Key: {key}" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"{fileUrl}\"}"
```

The parameters are:

- endpoint
- analyzerID
- key
- fileURL

We will store the endpoint, analyzerID, and API subscribion key in **Azure Key vault**, since these are constants for calling the analyzer. The fileURL will be specified as a **Fabric Pipeline parameter** so we can reuse the analyzer for different catalog files when calling the pipeline.

The endpoint and key parameters are found on your Azure AI Foundry resource under **Resource Management → Keys and Endpoint**:

![fabriccu1](/assets/images/fabric-ai-cu/fabricaicu01.png)

The analyzerID is the name of the analyzer you created in your AI Foundry hub:

![fabriccu2](/assets/images/fabric-ai-cu/fabricaicu02.png)

The fileURL is the url where your file is located. In my case, it is:
<https://raw.githubusercontent.com/contosojh/sample-files/main/summer-catalog-10-pages.pdf>

After you have gathered the information needed from Azure AI Foundry, disable public internet so it can only be accessed through the private internet or a private endpoint.
![fabriccu3](/assets/images/fabric-ai-cu/fabricaicu3.png)

---

## Store Secrets in Azure Key vault

Create 3 secrets in Key vault for the endpoint, the analyzerID, and the key:

![fabriccu4](/assets/images/fabric-ai-cu/fabricaicu4.png)

When you have completed creating your secrets, disable public access to the key vault so it will only be available over the private internet.
![fabriccu5](/assets/images/fabric-ai-cu/fabricaicu05.png)

---

## Create Workspace and Private Endpoints

Create a new Fabric workspace (or use an existing workspace). Open up the Workspace settings to create your private endpoints for **Azure Key vault** and your **AI Foundry Resource**. These endpoints are actually called *managed private endpoints* because they reside securely within Fabric. No need to create them in your own Vnet!
![fabriccu6](/assets/images/fabric-ai-cu/fabricaicu06.png)

To create the AI Foundry managed private endpoint, go to the **Azure portal**, then to your **Azure AI Foundry resource Overview page**. Click on the **JSON view** on the right and copy the **Resource ID**.

![fabriccu7](/assets/images/fabric-ai-cu/fabricaicu07.png)

Paste the Resource ID in the Resource identifier when creating the private endpoint. Next, click on the drop-down box for the Target sub-resource and click on **Cognitive Services**.

![fabricc8](/assets/images/fabric-ai-cu/fabricaicu08.png)

Click **Create**.

After the managed private endpoint is created for AI Foundry, you need to approve your private endpoint in Azure. Go back to the **Azure AI Foundry resource**, go to the **Networking** section and then to the **Private endpoint connections** tab. The connection state will be *Pending* so you will need to approve it. After it is approved, the connection state will say *Approved*.

![fabricc9](/assets/images/fabric-ai-cu/fabricaicu09.png)

Next, create the managed private endpoint for **Azure Key vault** following the same steps:

- Create a new Private endpoint in the Fabric workspace settings  
- Copy and paste the Azure Key Vault resource identifier  
- Select Azure Key Vault as the Target sub-resource  
- Go back to your Azure Key Vault and approve the private endpoint under **Settings → Networking → Private endpoint connections** tab

---

## Create Lakehouse (optional)

Create a new Lakehouse if you do not want to use an existing warehouse.

---

## Create a Notebook

Download the python notebook located here:

[Download the Fabric AI Content Understanding Notebook](/assets/notebooks/fabric-ai-cu/nbGetCourseInfo.ipynb)

Then go to your Fabric Workspace and select Import from the top menu:

![fabricc10](/assets/images/fabric-ai-cu/fabricaicu10.png)

The notebook contains the parameters as shown below. These will be passed in through the **Pipeline Notebook activity**. To test in-line, you can replace the noted values below with default values; otherwise, you can leave as-is and when the notebook is called from the pipeline, the parameter value defaults will be replaced by the parameter values passed in.

![fabricc11](/assets/images/fabric-ai-cu/fabricaicu11.png)

To get your workspace and lakehouse id values, navigate to your lakehouse. The workspace id is the string following `/groups/` and the lakehouse id is the string following `/lakehouses/`:

![fabriccu12](/assets/images/fabric-ai-cu/fabricaicu12.png)

Paste these into the parameter values for `content_ws_id` and `content_lh_id`.

Get the key vault secrets for the API subscription key, the AI endpoint, and the analyzer name.

![fabriccu13](/assets/images/fabric-ai-cu/fabricaicu13.png)

When you run the notebook, it will send a post request to analyze the PDF:

![fabriccu14](/assets/images/fabric-ai-cu/fabricaicu14.png)

It then sends polling requests until the request has completed or exceeded the timeout value:

![fabriccu15](/assets/images/fabric-ai-cu/fabricaicu15.png)

If it has completed successfully, it will write/append the data to the table.

![fabriccu16](/assets/images/fabric-ai-cu/fabricaicu16.png)
---

## Create Variable Library

Next we’ll create a **variable library**. A variable library is an item in Fabric that lets you store values at the workspace level. These are commonly used for CI/CD for connection strings, lakehouse names, warehouse names, etc.—values that need to be parameterized, but should be constant at the workspace level.

Go to your Workspace and create a new **Variable Library** item. Add variables and values for the Key Vault endpoint, the API subscription key secret name, the AI endpoint secret name, the analyzer name secret name, the lakehouse id, and the warehouse id.

![fabriccu17](/assets/images/fabric-ai-cu/fabriccu17.png)

---

## Create Pipeline

Create a new pipeline in your workspace. This may be your simplest pipeline ever!

Add parameters for the **document location**, your **lakehouse schema name**, and your **lakehouse table name**. These are parameterized at the pipeline level to make your pipeline reusable! For example, the content analyzer was created for the Summer 2025 Community Education catalog, but the analyzer can gather information for Fall 2025, Winter 2026, etc. You also have the option to store the data in the same or in separate tables.

![fabriccu18](/assets/images/fabric-ai-cu/fabriccu18.png)

Go to the **Library variables** tab and add in the library variables you will use in this pipeline.

![fabriccu19](/assets/images/fabric-ai-cu/fabriccu19.png)

On the **pipeline canvas**, add a **Notebook activity**. Specify the workspace and notebook name. Then expand the **Base parameters** section and add in the parameter names used in the notebook and specify the appropriate pipeline parameter or library variable for each:

![fabriccu19](/assets/images/fabric-ai-cu/fabriccu20.png)

---

## Run the Pipeline and Test the Results

Run the pipeline and validate the results by querying the lakehouse table:

![fabricaicu21](/assets/images/fabric-ai-cu/fabricaicu21.png)

If your data returns unknown or invalid data, you can go back to the AI Content Analyzer project and refine your prompts. I did that myself because the course category was returning a lot of “Unknowns.” This was my original courseCategory description:  

> Above the course listings, there will be a header. It will never be the same as the CourseName. This is the courseCategory. If you can't find the Category, specify "Unknown"

Which I changed to:

> Above the course listings, there will be a header. This is the courseCategory. This will be toward the top of the page - sometimes it is listed under "Arts & Music", but if there isn't a category below "Arts & Music", just use "Arts & Music". It will never be the same as the courseName. If you can't find the Category, first try and derive it from the other categories found. If it can't be found or derived, specify "Unknown".

---

## Create, Test and Publish Data Agent

Next, create and add a **Data Agent** item to your workspace. Give it a name, add your lakehouse and table, then Agent Instructions:

![fabriccu22](/assets/images/fabric-ai-cu/fabriccu22.png)

Then add instructions about your data source, the Delta Lake table. For example, delta lake string values are case sensitive, so I included that in my instructions. I also included synonyms for different fields.

![fabriccu23](/assets/images/fabric-ai-cu/fabricaicu23.png)

After that, I will test my agent:

![fabriccu24](/assets/images/fabric-ai-cu/fabriccu24.png)

I really just wanted a quick list:

![fabriccu25](/assets/images/fabric-ai-cu/fabriccu25.png)

Then I asked about classes that are out of the ordinary:

![fabriccu26](/assets/images/fabric-ai-cu/fabriccu26.png)


![fabriccu27](/assets/images/fabric-ai-cu/fabriccu27.png)

![fabriccu28](/assets/images/fabric-ai-cu/fabriccu28.png)

Hmmm … I then asked about what classes are available on week
ends and it did not give me a response:

![fabriccu29](/assets/images/fabric-ai-cu/fabriccu29.png)

So I will tell the agent how to do it:

![fabriccu30](/assets/images/fabric-ai-cu/fabriccu30.png)

You can click under the response and see the query it ran:

![fabriccu31](/assets/images/fabric-ai-cu/fabriccu31.png)

You can see that the agent figured out how to query for a specific day of the week. But I want the agent to know how to query or return a value for any day of the week. I will ask the agent to return a day of the week for all the classes:

![fabriccu32](/assets/images/fabric-ai-cu/fabriccu32.png)

I will save this query in my example queries, in case others have the same question!

![fabriccu33](/assets/images/fabric-ai-cu/fabriccu33.png)

I then cleared the chat and asked more questions about days of the week

![fabriccu34](/assets/images/fabric-ai-cu/fabriccu34.png)

![fabriccu35](/assets/images/fabric-ai-cu/fabriccu35.png)

OK you can see I was having fun with that! I will leave it as-is now, and I will publish my agent for others to use:

![fabriccu36](/assets/images/fabric-ai-cu/fabriccu36.png)

If there are other applications that will use the agent, they can leverage and call this API:

![fabriccu37](/assets/images/fabric-ai-cu/fabriccu37.png)

---

## Use Data Agent in Power BI CoPilot

Now that my Data Agent is published, I can use this in Power BI Copilot! Click on the **“Add items for better insights”** and select the agent:

![fabriccu38](/assets/images/fabric-ai-cu/fabriccu38.png)

I can share the agent with others and easily modify it if they report that it’s not returning expected results. I can simply update the agent instructions, data source instructions, or add more example queries and then re-publish.

![fabriccu38](/assets/images/fabric-ai-cu/fabriccu38.png)

---

## Conclusion

Integrating **Azure AI Content Understanding** with **Microsoft Fabric** enables a secure, scalable, and highly flexible approach to extracting and analyzing data from complex documents. By leveraging managed private endpoints, Key Vault secrets, variable libraries, and reusable pipelines, you can streamline data workflows and empower conversational AI agents to deliver actionable insights. This solution not only simplifies technical implementation but also enhances collaboration and accessibility for users across platforms like **Power BI Copilot** or your own custom app, making advanced document intelligence practical and impactful.
