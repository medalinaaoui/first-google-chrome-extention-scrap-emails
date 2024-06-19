document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentTab = tabs[0];
    var actionButton = document.getElementById("actionButton");
    var downloadCsvButton = document.getElementById("downloadCsvButton");
    var downloadJsonButton = document.getElementById("downloadJsonButton");
    var resultsTable = document.getElementById("resultsTable");
    var filenameInput = document.getElementById("filenameInput");

    if (currentTab) {
      document.getElementById("message").textContent =
        "Ready to scrape emails and names!";
      actionButton.disabled = false;
      actionButton.classList.add("enabled");
    } else {
      document.getElementById("message").textContent = "No active tab found.";
      actionButton.style.display = "none";
      downloadCsvButton.style.display = "none";
      downloadJsonButton.style.display = "none";
      filenameInput.style.display = "none";
    }

    actionButton.addEventListener("click", function () {
      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          function: scrapeData,
        },
        function (results) {
          while (resultsTable.firstChild) {
            resultsTable.removeChild(resultsTable.firstChild);
          }

          const headers = ["Name", "Email"];
          const headerRow = document.createElement("tr");
          headers.forEach((headerText) => {
            const header = document.createElement("th");
            header.textContent = headerText;
            headerRow.appendChild(header);
          });
          resultsTable.appendChild(headerRow);

          if (!results || !results[0] || !results[0].result) return;
          results[0].result.forEach(function (item) {
            var row = document.createElement("tr");
            ["name", "email"].forEach(function (key) {
              var cell = document.createElement("td");
              cell.textContent = item[key] || "";
              row.appendChild(cell);
            });
            resultsTable.appendChild(row);
          });

          if (
            results &&
            results[0] &&
            results[0].result &&
            results[0].result.length > 0
          ) {
            downloadCsvButton.disabled = false;
            downloadJsonButton.disabled = false;
          }
        }
      );
    });

    downloadCsvButton.addEventListener("click", function () {
      var csv = tableToCsv(resultsTable);
      var filename = filenameInput.value.trim();
      if (!filename) {
        filename = "emails-and-names.csv";
      } else {
        filename = filename.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".csv";
      }
      downloadCsv(csv, filename);
    });

    downloadJsonButton.addEventListener("click", function () {
      var json = tableToJson(resultsTable);
      var filename = filenameInput.value.trim();
      if (!filename) {
        filename = "emails-and-names.json";
      } else {
        filename = filename.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".json";
      }
      downloadJson(json, filename);
    });
  });
});

function scrapeData() {
  let data = [];
  let emails = document.querySelectorAll("#contact-profiles-table .content p");
  let names = document.querySelectorAll(
    "#contact-profiles-table .content .header"
  );

  for (let i = 0; i < emails.length; i++) {
    let email = emails[i].textContent.trim();
    let name = names[i].textContent.trim();
    data.push({ name: name, email: email });
  }

  return data;
}

function tableToCsv(table) {
  var csv = [];
  var rows = table.querySelectorAll("tr");

  for (var i = 0; i < rows.length; i++) {
    var row = [],
      cols = rows[i].querySelectorAll("td, th");

    for (var j = 0; j < cols.length; j++) {
      row.push('"' + cols[j].innerText + '"');
    }
    csv.push(row.join(","));
  }
  return csv.join("\n");
}

function downloadCsv(csv, filename) {
  var csvFile;
  var downloadLink;

  csvFile = new Blob([csv], { type: "text/csv" });
  downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

function tableToJson(table) {
  var rows = table.querySelectorAll("tr");
  var headers = [];
  var data = [];

  for (var i = 0; i < rows.length; i++) {
    var cols = rows[i].querySelectorAll("td, th");
    var rowData = {};

    if (i === 0) {
      for (var j = 0; j < cols.length; j++) {
        headers[j] = cols[j].innerText;
      }
    } else {
      for (var j = 0; j < cols.length; j++) {
        rowData[headers[j]] = cols[j].innerText;
      }
      data.push(rowData);
    }
  }
  return data;
}

function downloadJson(json, filename) {
  var jsonFile;
  var downloadLink;

  var jsonString = JSON.stringify(json, null, 2); // Pretty-print JSON with 2-space indentation
  jsonFile = new Blob([jsonString], { type: "application/json" });
  downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(jsonFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
}
