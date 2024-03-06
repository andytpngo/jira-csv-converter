const fileInput = document.getElementById('csv');
let contents = []; // globally contains csv data as 2D array
let baseFilename = 'file';
let exportData = [];
let LIMIT = 8;
document.getElementById('export-button').style.visibility = 'hidden';

const readFile = () => {
  const reader = new FileReader()
  reader.onload = () => {
    const csvData = reader.result;
    // convert from csv to 2d array
    convertCSVto2DArray(csvData);
    // Modify it 
    modifyCSV(contents);
    // Generate a preview
    createTable(exportData);
  }
  baseFilename = fileInput.files[0].name;
  if (baseFilename.endsWith('.csv'))
  {
    baseFilename = baseFilename.substring(0, baseFilename.indexOf('.csv'));
  }
  reader.readAsText(fileInput.files[0])
}

fileInput.addEventListener('change', readFile)

const convertCSVto2DArray = (s) => {
    Papa.parse(s, {
        complete: function(results) {
            contents = results.data;
        },
        header: false,
        skipEmptyLines: true,
        escapeChar: '"',
        quoteChar: '"',
        delimeter: ","
    })
}

const onLimitChange = () => {
    LIMIT = document.getElementById("limit").value;
    if (!LIMIT)
    {
        LIMIT = 0;
    }
    if (contents.length > 0)
    {
        exportData = [];
        modifyCSV(contents);
        // reset table 
        document.getElementById("table-div").outerHTML = "<div id='table-div'></div>"
        createTable(exportData);
    }
}

const resetGlobalVariables = () => 
{
    contents = [];
    baseFilename = 'file';
    exportData = [];
}


// Given a CSV in form of 2D array
const modifyCSV = (csvData) => {
    let startIndex = 0;
    let employees = []
    // remove 1st column
    csvData = csvData.map(line => line.slice(1));
    for (let i=0; i < csvData.length; i++)
    {
        if (csvData[i][0] === 'Web Development - Task Description')
        {
            employees = csvData[i].slice(1).filter((emp) => emp && emp.length > 0);
            startIndex = i;
            break;
        }
    }
    if (employees.length === 0)
    {
        document.getElementById('err').innerHTML = "No employees found";
        resetGlobalVariables();
    }
    else
    {
        document.getElementById('export-button').style.visibility = 'visible';
        document.getElementById('err').innerHTML = "Preview:";
        // append data to export csv
        // add header
        exportData.push(['Summary', 'Assignee', 'Time Spent (hours)']);

        // TODO: some summaries are repeated (i.e. template and configuration)
        // do we...
        // 1) combine them and merge hours
        // 2) make it more descriptive "News - Template" and "Profile Cards - Template"
        //      - need to find a way to make parents and children summaries?
        for (let i=startIndex+1; i<csvData.length; i++)
        {
            let line = csvData[i];
            if (line.length >= employees.length)
            {
                let description = line[0];
                if (description)
                {
                    // remove whitespace
                    description = description.trim();
                    for (let j=0; j<employees.length; j++)
                    {
                        let summary = description + ' - ' + employees[j];
                        let hours = line[j+1];
                        if (hours && !isNaN(hours) && parseFloat(hours) <= LIMIT)
                        {
                            exportData.push([summary, employees[j], hours]);
                        }
                    }
                }
            }
        }
    }
}



function createTable(tableData) {
    let table = document.createElement('table');
    console.log(table);
    let tableBody = document.createElement('tbody');
    tableData.forEach(function(rowData) {
        var row = document.createElement('tr');

        rowData.forEach(function(cellData) {
        var cell = document.createElement('td');
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
    table.appendChild(tableBody);
    document.getElementById('table-div').innerHTML = table.outerHTML;
}

// Export as CSV
const exportCSV = () => {
    if (!exportData)
    {
        return;
    }
    let csvData = "data:text/csv;charset=utf-8,";
    exportData.forEach(function(rowArray) {
        // wrap each value with quotations
        let row = rowArray.map((s) => {return '\"' + s + '\"'});
        row = row.join(",");
        csvData += row + "\n";
    });
    var encodedUri = encodeURI(csvData);

    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", baseFilename + "_jira_formatted.csv");
    document.body.appendChild(link);
    link.click();
}