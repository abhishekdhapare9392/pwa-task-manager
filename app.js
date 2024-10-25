let db;

// Initialize IndexedDB
window.onload = function () {
  let request = window.indexedDB.open("taskManagerDB", 1);

  request.onsuccess = function (event) {
    db = event.target.result;
    displayTasks();
  };

  request.onerror = function () {
    console.error("An error occurred with IndexedDB");
  };

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
  };
};

// Add a new task
document.getElementById("task-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const taskInput = document.getElementById("task-input");
  const task = { text: taskInput.value };

  if (task.text === "") return;

  let transaction = db.transaction(["tasks"], "readwrite");
  let store = transaction.objectStore("tasks");
  store.add(task);

  transaction.oncomplete = function () {
    taskInput.value = "";
    displayTasks();
  };
});

// Function to check if there are tasks and toggle the visibility of export buttons
function toggleExportButtons() {
  let transaction = db.transaction(["tasks"], "readonly");
  let store = transaction.objectStore("tasks");
  let taskCount = 0;

  store.openCursor().onsuccess = function (event) {
    let cursor = event.target.result;
    if (cursor) {
      taskCount++;
      cursor.continue();
    } else {
      // Show or hide export buttons based on task count
      const exportButtons = document.getElementById("export-buttons");
      if (taskCount > 0) {
        exportButtons.classList.remove("hidden");
      } else {
        exportButtons.classList.add("hidden");
      }
    }
  };
}

// Display all tasks
function displayTasks() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";

  let transaction = db.transaction(["tasks"], "readonly");
  let store = transaction.objectStore("tasks");
  store.openCursor().onsuccess = function (event) {
    let cursor = event.target.result;
    if (cursor) {
      const li = document.createElement("li");
      li.classList.add(
        "bg-white",
        "p-4",
        "rounded",
        "shadow",
        "flex",
        "justify-between",
        "items-center",
      );
      li.innerHTML = `
                <span>${cursor.value.text}</span>
                <div>
                    <button class="edit text-blue-500 mr-2" onclick="editTask(${cursor.value.id}, '${cursor.value.text}')">Edit</button>
                    <button class="delete text-red-500" onclick="deleteTask(${cursor.value.id})">Delete</button>
                </div>
            `;
      taskList.appendChild(li);
      cursor.continue();
    }
  };
  toggleExportButtons();
}

// Edit a task
function editTask(id, oldTask) {
  const newTask = prompt("Edit task:", oldTask);
  if (newTask === null || newTask === "") return;

  let transaction = db.transaction(["tasks"], "readwrite");
  let store = transaction.objectStore("tasks");
  let request = store.get(id);

  request.onsuccess = function () {
    const task = request.result;
    task.text = newTask;
    store.put(task);
    displayTasks();
  };
}

// Delete a task
function deleteTask(id) {
  let transaction = db.transaction(["tasks"], "readwrite");
  let store = transaction.objectStore("tasks");
  store.delete(id);
  displayTasks();
}

// Export tasks to CSV
function exportToCSV() {
  let transaction = db.transaction(["tasks"], "readonly");
  let store = transaction.objectStore("tasks");
  let tasks = [];

  store.openCursor().onsuccess = function (event) {
    let cursor = event.target.result;
    if (cursor) {
      tasks.push(cursor.value);
      cursor.continue();
    } else {
      let csvContent = "data:text/csv;charset=utf-8,ID,Task\n";
      tasks.forEach((task) => {
        csvContent += `${task.id},${task.text}\n`;
      });

      // Create a download link and trigger the download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "tasks.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
}

// Export tasks to Excel (XLSX format)
function exportToExcel() {
  let transaction = db.transaction(["tasks"], "readonly");
  let store = transaction.objectStore("tasks");
  let tasks = [];

  store.openCursor().onsuccess = function (event) {
    let cursor = event.target.result;
    if (cursor) {
      tasks.push(cursor.value);
      cursor.continue();
    } else {
      const header = [["ID", "Task"]];
      const rows = tasks.map((task) => [task.id, task.text]);
      const worksheet = XLSX.utils.aoa_to_sheet(header.concat(rows));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

      // Create a download link and trigger the download
      XLSX.writeFile(workbook, "tasks.xlsx");
    }
  };
}

// Export tasks to Text file
function exportToText() {
  let transaction = db.transaction(["tasks"], "readonly");
  let store = transaction.objectStore("tasks");
  let tasks = [];

  store.openCursor().onsuccess = function (event) {
    let cursor = event.target.result;
    if (cursor) {
      tasks.push(cursor.value);
      cursor.continue();
    } else {
      let textContent = "ID, Task\n";
      tasks.forEach((task) => {
        textContent += `${task.id}, ${task.text}\n`;
      });

      // Create a download link and trigger the download
      const blob = new Blob([textContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "tasks.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
}
