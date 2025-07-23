---
layout: default
title: "Use Azure AI Content Understanding and Natural Language to Extract Data from Complex documents"
date: 2025-07-22
categories: [Azure AI]
image: /assets/images/MountJosephine.png
---

Extracting key field information from documents is a mundane task in pretty much every organization, such as check processing, invoice processing, purchase orders, etc. Azure AI Document Intelligence is the tool that often comes to mind for automation of document processing with both prebuilt and custom templates. However, when documents are very complex, without fixed fields and values, Document Intelligence may not produce the expected results.

Let’s take a real-world example: the PDF of a community education course catalog, like this one: *Spring/Summer 2025 Adult and Youth Classes*. I want to extract all the course information from the catalog: the course name, the description, the category, the instructor name, the start date and time, the end date, the location and cost and eventually load it into a database or lakehouse to query. If you open the course catalog, you will notice there is a cover page, a calendar, a table of contents, and other information I do not want to extract.

As you look through the course information, you will notice that the course listings don’t completely follow the same format. A course may have multiple sections of it, with different dates and times:

![Course Section Example]({{ "/assets/images/1-catalog.png" | relative_url }})

I will want to repeat the course name, description and instructor for each course section.

And sometimes there are multiple instructors for different course sections and note there is no end date, just the number of sessions:

![Instructors and Sessions]({{ "/assets/images/2-catalog.png" | relative_url }})

To automate, data extraction by labeling would be difficult. You could try defining a table but Document Intelligence expects consistent columns and rows. You would need to label a lot of documents and the model would struggle with inconsistent layouts or nested data.

However, **Azure AI Content Understanding** is designed to handle exactly these kinds of challenges. Instead of relying on labeled training data and rigid templates, it allows you to describe what you want to extract using natural language.

You can define the fields you're interested in—like `courseName`, `courseLocation`, `courseStartDate` and `courseEndDate`—and then use the field description to provide instructions (or prompts) to describe what defines the value for that field.

## This means:
- No need to label dozens of documents – use natural language to describe how to extract the data
- Support for complex, unstructured layouts
- Ability to use calculations for field values
- Faster time to value, especially for dynamic or creative content

---

## Getting Started with Azure AI Content Understanding

To start with Azure AI Content Understanding, you need an **Azure AI Foundry Hub**.

Within your Azure Subscription, go to **Azure AI Foundry**:

![Create Project]({{ "/assets/images/3-foundry.png" | relative_url }})

Create an Azure AI Foundry hub-based project in one of the supported regions:

![Create Project]({{ "/assets/images/4-foundry.png" | relative_url }})

You will be directed to specify a **Project Name** and a **Hub Name**, then click **Create**.

In Azure AI Hub, click:
- `Content Understanding` > `Custom Task` > `Create`

![Start Task]({{ "/assets/images/5-countentunderstanding.png" | relative_url }})

On the next screen, choose **Multi-file processing** for its advanced reasoning skills:

![Multi-file Option]({{ "/assets/images/6-contentunderstanding.png" | relative_url }})

---

### Define a Schema

Next, define a schema where you can enter:
- Field name
- Field description
- Datatype of each field

The **field description** is what makes this tool powerful. You can define exactly what and how to extract data.

![Schema Editor]({{ "/assets/images/7-contentunderstanding.png" | relative_url }})

Data types can be:
- Tables
- Lists
- Scalar values

![Data types]({{ "/assets/images/8-contentunderstanding.png" | relative_url }})

---

## The Course Catalog Example Schema

For my course extraction example, I defined a **table** and gave it very detailed information on what to extract as well as what to ignore. I also noted that the actual unique key is the **course section**, since a course may have more than one section. I provided detailed information on how to repeat the course name and description for each section.

![Schema Example]({{ "/assets/images/9-contentunderstanding.png" | relative_url }})

> “Extract course information from this catalog. The key is the course section number, which is 4 digits followed by 2 or 3 letters. Create a row for each course section number. The course name and description is above the course section information. There may be multiple sections for a course so populate the course name and description in each row. To help you link the course name and description to the course section, the first 4 digits of the course is the same for each course name and description. Each course section always has a location, date, time, number of sessions and price. The course may also have a section name, which would be immediately above the course section number. Ignore any other general information community education and table.”

I then created subfields in the table, and for each subfield, I provided descriptions:

![Subfields Example]({{ "/assets/images/10-contentunderstanding.png" | relative_url }})

---

### Notable Subfield Descriptions

- **`courseInstructor`**: This is the name of the instructor. Usually it is 1 or 2 initials followed by a last name, but sometimes it is a few words. It may be below the course section number or beneath the course description. In that case, use that instructor name for all descriptions.

- **`courseEndDate`**: Compute the courseEndDate by taking the courseStartDate and adding the number of weeks. For example:
  - If the courseStartDate is August 1 and the number of sessions is 1 → End Date = August 1
  - If sessions = 2 → End Date = August 8
  - If sessions = 3 → End Date = August 15

- **`courseCategory`**: Above the course listings, there will be a header. It will never be the same as the courseName. This is the courseCategory. If you can't find the Category, specify `"Unknown"`.

- **`courseSectionName`**: Below the course description, and below the course instructor if it exists, and above the course section number, there may be a course section name. It will be 1 to 5 words. Include it if you find it, otherwise leave blank.  
  > _Example: “Largo” and “Sweet Dreams” under Alexander Oil Painting.

You can view the full schema here: ({{ "/assets/files/_communityEdCourseCatalog_prebuilt-documentAnalyzer_2025-05-01-preview.json" | relative_url }})

And if you wish, you can import the file into your own Content Understanding project.

---

## Run the Analyzer

Next, upload at least 1 file. if you are doing this in your own environment, you can use one of these example files: 

- [Spring/Summer 2025 Adult and Youth Classes - 6 pages(PDF)](/assets/files/summer-catalog-06-pages.pdf)
- [Winter 2025 Community Ed Catalog - 10 pages(PDF)](/assets/files/summer-catalog-10-pageg.pdf)

Click **Run Analysis** to build a **Test Analyzer**.

![Run Analysis]({{ "/assets/images/11-contentunderstanding.png" | relative_url }})

After running, check the **Prediction** tab — 70 rows were returned in my example. You can view the results in:
- **List View** (down arrow icon)
- **Table View** (grid icon)

![Prediction Results]({{ "/assets/images/12-contentunderstanding.png" | relative_url }})

Review the results. If needed, adjust the schema or field descriptions and **re-run** the analyzer.

When satisfied, click **Build Analyzer** to create an endpoint and subscription key for your application.

![Build Analyzer]({{ "/assets/images/13-contentunderstanding.png" | relative_url }})

---

## Final Testing

Give your analyzer a name and description. Once the status is **Ready**, test it with your application.

> I created two analyzers — one as a baseline, and the second with updates to schema and descriptions.

![Analyzer Versions]({{ "/assets/images/14-contentunderstanding.png" | relative_url }})

At the bottom of the screen, you’ll see:

- Sample **Python code**
- Links to use the REST API

The sample code also includes the **resource key** — save this in **Azure Key Vault** for authentication.

![Sample Code]({{ "/assets/images/15-contentunderstanding.png" | relative_url }})

You can also get the **subscription key** and **model endpoint** from the **Model and Endpoints** section in Azure AI Foundry.

![End Points]({{ "/assets/images/16-contentunderstanding.png" | relative_url }})

I created then created a Python notebook to call the endpoint and display the results:

![DataFrame Output]({{ "/assets/images/12-contentunderstanding.png" | relative_url }})

In the next blog, I will show how to use the **Azure AI Content Understanding** endpoint to extract data from complex documents and store contents in a database or lakehouse.

---

## Conclusion

With Azure AI's Content Understanding, field extraction becomes a **game-changer**—especially when you're dealing with complex or unstructured documents that don’t follow a tidy, consistent form layout.

You can harness the power of **Natural Language Processing (NLP)** to intelligently extract names, dates, totals, and even calculated fields with minimal setup — regardless of document structure.

It’s:
- Smarter ✅
- Faster ✅
- More scalable ✅

...and it can save **hours or even days** of manual work!

Whether you're working with menus, handwritten forms, catalogs, brochures, or any other semi-structured content — **Azure AI Content Understanding** helps you unlock the data inside.

