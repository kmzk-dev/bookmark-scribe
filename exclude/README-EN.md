# Bookmark Scribe
Bookmark Scribe is a Google Chrome extension designed to effectively manage development resources that you don't use often but need to refer to sometimes (like API references or design tools), and links whose content isn't clear from the title alone. It separates these links from your standard browser bookmarks and allows you to add context, making it easy to find the information you need, right when you need it.

## Purpose and Concept
- **Add Context:** By adding comments about the purpose or a detailed summary to a link, you can understand its content without having to open it.
- **Declutter Your Main Bookmarks:** It separates less frequently used links, helping to keep your main browser bookmarks clean and improving visibility.
- **Ensure Data Integrity:** It uses the URL as a unique key to prevent duplicate entries and ensure you always have the most up-to-date information.
 
**Use Cases:**
- **Happy Hues:** A great site for choosing color palettes for web design, but not something you'd use every day.
- **Lorem Picsum:** An API that provides placeholder images. You access specific endpoints to generate sample image URLs.

These are all excellent web tools.
Many web development tools and reference sites like these are hard to remember by their title alone. Saving them in your browser's bookmark bar can quickly clutter it, hiding the pages you actually use frequently.

Bookmark Scribe solves this by separating those links from your main bookmarks, keeping your bookmark bar organized for the essentials. For those who have been using spreadsheets or note-taking apps, Bookmark Scribe offers a much smarter way to access these links.

## Main Features
- Quick Add: Quickly save the current page by adding a comment. The title is also editable. The URL is handled as a unique key and is not displayed.
- Label Management: Organize links with custom labels. If no label is selected, it will be saved as "Unclassified." Labels are managed by an ID, so even if you rename a label in the settings, the connection to your bookmarks is maintained.
- Data Overwriting: If you save a link with a URL that already exists, the information will be updated with the latest entry (no duplicates are allowed).
- List View: From the list view, you can open links, edit titles, comments, and labels to keep your information current. The list is displayed in order of last updated date.
- Filter List: You can filter the bookmarks shown by using the Filter by label dropdown.
- Search List: Perform an incremental search across titles, comments, and label names.

## Data Sync
- CSV Export: Export your current bookmark data (Title, URL, Comment, Label, Last Updated) as a UTF-8 (with BOM) CSV file.
- CSV Import: Restore your data from a CSV file. Imported data is automatically assigned to an "Import" label, and any existing data with the same URL will be overwritten.

### CSV Import File Rules
- Restoring Data: If you are restoring from an exported file, it is recommended not to re-edit the exported data. Tools like Excel can display and edit CSVs, but they are designed to convert CSVs into their own format and may not save them correctly.
- Adding New Data: If you are using the import function to add new data (not restore), please adhere to the following rules strictly.

**Rules:**
|Item|Rule|Notes|
|-|-|-|
|Encoding|UTF-8 (with BOM)|The BOM (Byte Order Mark) is required to prevent character corruption for non-English characters.|
|Escaping|"" (double quotes) enclosure|All fields (columns) must be enclosed in double quotes ("). Any double quotes inside a field should be escaped by doubling them ("").|
|Header Row|Required|The first row is always skipped during import, so you must include a header row.|
|Mapping||Data is mapped by column number.|

**Sample:** Refer to the sample below for the row structure. In this case, the first line is the header and will not be imported.
```text
"Title","URL","Comment"
"EXAMPLE.COM","[https://example.com](https://example.com)","A shared address that returns a dummy URL. Useful for sample pages and manuals."
"Lorem Picsum","[https://example.com](https://example.com)","Provides API endpoints to generate random sample image URLs for mockups."
"Happy Hues","[https://example.com](https://example.com)","A collection of color palette templates. Used for reference when creating CSS."
```
This sample is in csv dir.
<img src="/exclude/img/reamme-sample-001.png">

**Label Handling:** The import function automatically creates and assigns an Import label. This allows you to filter for imported data using Filter by label. After editing the labels for all imported items, you can safely delete the Import label if it is no longer needed.

**Note on creating CSVs:** Using spreadsheet software like Excel to create or edit CSV files can sometimes cause issues (e.g., losing double quotes or the BOM).To avoid this, it's recommended to edit the exported CSV file with a plain text editor or code editor.

## Tech Stack
- **Platform**: Google Chrome Extension (Manifest V3)
- **Data Store**: chrome.storage.local

Shared constants are centralized in `statics/js/constants.js` to ensure code maintainability and stability.

## How to Use
This section explains how to get started.

### Installation
Bookmark Scribe is available for free on the Chrome Web Store.
Click the URL below or copy and paste it into your address bar to visit the store.
[Download on the Chrome Web Store]()

### Tutorial
Once installed, let's try bookmarking [Browse Fonts - Google Fonts](https://fonts.google.com). Fonts are a key element in creating polished web designs, but you probably don't visit this site every day. Adding links like this can clutter your bookmark bar, which can be a hidden source of stress. Let Bookmark Scribe help reduce that stress.

#### Adding a Bookmark
It's simple. On the page you want to save, click the Bookmark Scribe icon in your toolbar. Add a comment or select a label from the popup.
- The `ADD` button will open the label settings page in a new tab (the popup will close).
- The `Open list-View` link will open your list of saved bookmarks in a new tab.

<img src="/exclude/img/readme-sample-002.png">

#### Creating Labels & Viewing the Bookmark List
You can manage labels and view your bookmarks on dedicated pages.
The easiest way to access them is by **right-clicking the Bookmark Scribe icon** in your toolbar to open the context menu.
<img src="/exclude/img/readme-sample-003.png">
- **Open Bookmark List:** Displays a list of your saved bookmarks.
- **Set Labels:** Opens the settings page to create or manage labels.

Creating labels is simple and intuitive.
<img src="/exclude/img/readme-sample-004.png">

In the list view, you can search and filter by label. Clicking a link will open it in a new tab.
<img src="/exclude/img/readme-sample-005.png">

---

Thank you for reading.
We hope you enjoy managing your awesome links with Bookmark Scribe!
