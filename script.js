const fileInput = document.getElementById('csv');
let contents = []; // globally contains csv data as 2D array
let baseFilename = 'file';
let exportData = [];
let LIMIT = 8;
let EMPLOYEES_GLOBAL = [];
document.getElementById('export-button').style.visibility = 'hidden';

const readFile = () => {
  const reader = new FileReader()
  reader.onload = () => {
    const csvData = reader.result;
    // convert from csv to 2d array
    convertCSVto2DArray(csvData);
    // Modify it 
    exportData = modifyCSV(contents);
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
        exportData = modifyCSV(contents);
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
    EMPLOYEES_GLOBAL = [];
}

const countLeadingSpaces = (inputString) => {
    // Use a regular expression to match leading spaces
    const matches = inputString.match(/^(\s+)/);
  
    // Check if matches were found
    if (matches) {
      // Count the length of the matched spaces
      return matches[1].length;
    } else {
      // No leading spaces found
      return 0;
    }
}

const gcf = (num1, num2) => {
    // Ensure both numbers are positive integers
    num1 = Math.abs(Math.floor(num1));
    num2 = Math.abs(Math.floor(num2));
    while (num2) {
        const temp = num2;
        num2 = num1 % num2;
        num1 = temp;
    }
    return num1;
}

function findClosestMultipleOfN(x, n)
{
    if (x%n === 0 || n%x === 0)
    {
        return x;
    }
    if (x%n <= n/2)
    {
        return x - x%n;
    }
    return x + n - (x%n);
}

// Given a CSV in form of 2D array
const modifyCSV = (csvData) => {
    let startIndex = 0;
    let employees = []

    let matrix = []
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
        // Show employee translation boxes
        let s = '<p>Define emails for each employee abbreviation:</p>\n';
        for (let i=0; i<employees.length; i++)
        {
            EMPLOYEES_GLOBAL.push(employees[i]);
            s += '<div style="display: flex;">\n'
            s += `  <label>${employees[i]}</label>\n`
            s += `  <input id="${employees[i]}-email" type="string"></input>\n`
            s += '</div>\n'
        }
        document.getElementById('translation-div').innerHTML = s;
        document.getElementById('export-button').style.visibility = 'visible';
        document.getElementById('err').innerHTML = "Preview:";
        // append data to export csv
        // add header
        matrix.push(['Summary', 'Assignee', 'Time Spent (hours)']);

        let stack = [csvData[startIndex][0].trim()];
        for (let i=startIndex+1; i<csvData.length; i++)
        {
            let line = csvData[i];
            if (startIndex+1 < i)
            {
                // look backwards
                let prevLine = csvData[i-1];
                let currentSpaceCount = countLeadingSpaces(line[0]);
                let prevSpaceCount = countLeadingSpaces(prevLine[0]);
                if (currentSpaceCount ==0)
                {
                    stack = [];
                }
                else if (currentSpaceCount <= prevSpaceCount)
                {
                    let difference = (prevSpaceCount-currentSpaceCount)/gcf(prevSpaceCount, findClosestMultipleOfN(currentSpaceCount, prevSpaceCount));
                    console.log('--------')
                    console.log(`prevSpaceCount: ${prevSpaceCount}`);
                    console.log(`currentSpaceCount: ${currentSpaceCount}`);
                    console.log(`gcf: ${gcf(prevSpaceCount, currentSpaceCount)}`)
                    console.log(`findClosestMultipleOfN(${currentSpaceCount}, ${prevSpaceCount}): ${findClosestMultipleOfN(currentSpaceCount, prevSpaceCount)}`)
                    console.log(`diff: ${difference}`);
                    console.log(`line: ${line}`)
                    console.log(`prevLine: ${prevLine}`)
                    console.log(`stack (before): ${stack}`);
                    
                    for (let q=0; q<difference+1; q++)
                    {
                        stack.pop();
                    }
                }
                stack.push(line[0].trim())
                console.log(`stack (after): ${stack}`);

            }
            if (line.length >= employees.length)
            {
                let description = line[0];
                if (description)
                {
                    for (let j=0; j<employees.length; j++)
                    {
                        // let summary = description + ' - ' + employees[j];
                        let tmpStack = [...stack];
                        tmpStack.push(employees[j]);
                        tmpStack.push(stack.length);
                        let summary = tmpStack.join(' - ');
                        let hours = line[j+1];
                        if (hours && !isNaN(hours) && parseFloat(hours) <= LIMIT)
                        {
                            matrix.push([summary, employees[j], hours]);
                        }
                    }
                }
            }
        }
    }
    return matrix;
}

// TODO: make it so that the export csv button doesn't appear until you enter in all emails


function createTable(tableData) {
    let table = document.createElement('table');
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

    // look at header
    let header = exportData[0];
    let idx = 0;
    // find index of "Assignees"
    for (let i=0; i<header.length; i++)
    {
        if (header[i] === 'Assignee')
        {
            idx = i;
        }
    }
    // For every row in that index, use the value of the input val
    for (let i=1; i<exportData.length; i++)
    {
        
        let employee = exportData[i][idx];
        exportData[i][idx] = document.getElementById(`${employee}-email`).value;
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