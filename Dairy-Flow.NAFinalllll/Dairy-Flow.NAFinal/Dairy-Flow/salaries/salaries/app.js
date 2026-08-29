// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = loadDataFromStorage();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderTable();
    updateEmployeeCount();
});

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Load data from localStorage
function loadDataFromStorage() {
    const stored = localStorage.getItem('employeeSalariesData');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default data
    const today = getTodayDate();
    return {
        [today]: {
            date: today,
            employees: [
                { id: 1, date: today, name: 'John Smith 2', amount: 10131.00, paid: 9350.00 },
                { id: 2, date: today, name: 'Sarah Smith 2', amount: 19752.00, paid: 12400.00 },
                { id: 3, date: today, name: 'Michael Smith 2', amount: 21506.00, paid: 3850.00 },
                { id: 4, date: today, name: 'Emily Smith 2', amount: 21109.00, paid: 20200.00 },
                { id: 5, date: today, name: 'David Smith 2', amount: 23042.00, paid: 5000.00 },
                { id: 6, date: today, name: 'Jessica Smith 2', amount: 10152.00, paid: 7750.00 }
            ]
        }
    };
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('employeeSalariesData', JSON.stringify(dataHistory));
}

// Initialize the app
function initializeApp() {
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    const currentYear = new Date().getFullYear();
    const searchYearInput = document.getElementById('searchYear');
    searchYearInput.min = currentYear - 5;
    searchYearInput.max = currentYear;
}

// Setup event listeners
function setupEventListeners() {
    // Edit Mode Button
    document.getElementById('editModeBtn').addEventListener('click', toggleEditMode);
    
    // Add Employee Button
    document.getElementById('addEmployeeBtn').addEventListener('click', handleAddEmployee);
    
    // Export Buttons
    document.getElementById('excelBtn').addEventListener('click', exportToExcel);
    document.getElementById('pdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    
    // Search Modal
    document.getElementById('searchDataBtn').addEventListener('click', openSearchModal);
    document.getElementById('cancelSearchBtn').addEventListener('click', closeSearchModal);
    document.getElementById('confirmSearchBtn').addEventListener('click', handleSearch);
    
    // Close modal on overlay click
    document.getElementById('searchModal').addEventListener('click', function(e) {
        if (e.target === this) closeSearchModal();
    });
}

// Toggle Edit Mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editModeBtn');
    const addEmployeeSection = document.getElementById('addEmployeeSection');
    
    if (isEditMode) {
        editBtn.classList.add('active');
        addEmployeeSection.style.display = 'block';
    } else {
        editBtn.classList.remove('active');
        addEmployeeSection.style.display = 'none';
    }
    
    renderTable();
}

// Get current data
function getCurrentData() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = {
            date: currentDate,
            employees: []
        };
    }
    return dataHistory[currentDate];
}

// Format date for display (DD/MM/YYYY)
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Calculate balance
function calculateBalance(amount, paid) {
    return (parseFloat(amount) || 0) - (parseFloat(paid) || 0);
}

// Update employee count
function updateEmployeeCount() {
    const data = getCurrentData();
    document.getElementById('employeeCount').textContent = `${data.employees.length} employees`;
}

// Render table
function renderTable() {
    const tbody = document.getElementById('employeeTableBody');
    const data = getCurrentData();
    
    tbody.innerHTML = '';
    
    data.employees.forEach((employee, index) => {
        const row = document.createElement('tr');
        const balance = calculateBalance(employee.amount, employee.paid);
        const displayDate = formatDateForDisplay(employee.date || currentDate);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(employee, 'date', displayDate)}</td>
            <td>${renderCell(employee, 'name', employee.name, 'text')}</td>
            <td>${renderCell(employee, 'amount', employee.amount.toFixed(2), 'number')}</td>
            <td>${renderCell(employee, 'paid', employee.paid.toFixed(2), 'number')}</td>
            <td>${balance.toFixed(2)}</td>
            <td>
                ${isEditMode ? `<button class="btn btn-delete" onclick="handleDelete(${employee.id})">Delete</button>` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners for editable inputs
        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', function() {
                    updateEmployee(employee.id, field, this.value);
                });
            });
        }
    });
    
    updateEmployeeCount();
}

// Render date cell
function renderDateCell(employee, field, displayValue) {
    if (isEditMode) {
        const dateValue = employee.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input">`;
    }
    return displayValue;
}

// Render cell
function renderCell(employee, field, value, type) {
    if (isEditMode) {
        if (type === 'text') {
            return `<input type="text" value="${value}" data-field="${field}" class="editable-input name-input">`;
        } else if (type === 'number') {
            return `<input type="number" value="${value}" data-field="${field}" class="editable-input amount-input" step="0.01">`;
        }
    }
    return value;
}

// Update employee
function updateEmployee(id, field, value) {
    const data = getCurrentData();
    const employee = data.employees.find(e => e.id === id);
    
    if (employee) {
        if (field === 'name') {
            employee[field] = value;
        } else if (field === 'date') {
            employee[field] = value;
        } else {
            employee[field] = parseFloat(value) || 0;
        }
        
        saveDataToStorage();
        renderTable();
    }
}

// Handle Add Employee
function handleAddEmployee() {
    const name = document.getElementById('employeeName').value.trim();
    const amount = parseFloat(document.getElementById('employeeAmount').value) || 0;
    const paid = parseFloat(document.getElementById('employeePaid').value) || 0;
    
    if (!name) {
        alert('Please enter employee name');
        return;
    }
    
    const data = getCurrentData();
    const newEmployee = {
        id: data.employees.length > 0 ? Math.max(...data.employees.map(e => e.id)) + 1 : 1,
        date: currentDate,
        name: name,
        amount: amount,
        paid: paid
    };
    
    data.employees.push(newEmployee);
    saveDataToStorage();
    renderTable();
    
    // Clear form
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeAmount').value = '';
    document.getElementById('employeePaid').value = '';
}

// Handle Delete
function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this employee?')) {
        return;
    }
    
    const data = getCurrentData();
    const index = data.employees.findIndex(e => e.id === id);
    
    if (index > -1) {
        data.employees.splice(index, 1);
        saveDataToStorage();
        renderTable();
    }
}

// Export to Excel
function exportToExcel() {
    const data = getCurrentData();
    
    const excelData = data.employees.map((employee, index) => ({
        '#': index + 1,
        'Date': formatDateForDisplay(employee.date || currentDate),
        'Name': employee.name,
        'Amount (₹)': employee.amount.toFixed(2),
        'Paid (₹)': employee.paid.toFixed(2),
        'Balance (₹)': calculateBalance(employee.amount, employee.paid).toFixed(2)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Salaries');
    
    XLSX.writeFile(workbook, `Employee_Salaries_${currentDate}.xlsx`);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(65, 105, 225);
    doc.text('Employee Salaries', 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 28);
    doc.text(`Total Employees: ${getCurrentData().employees.length}`, 14, 35);
    
    const data = getCurrentData();
    
    // Prepare table data
    const tableData = data.employees.map((employee, index) => [
        index + 1,
        formatDateForDisplay(employee.date || currentDate),
        employee.name,
        employee.amount.toFixed(2),
        employee.paid.toFixed(2),
        calculateBalance(employee.amount, employee.paid).toFixed(2)
    ]);
    
    // Add table
    doc.autoTable({
        head: [['#', 'Date', 'Name', 'Amount (₹)', 'Paid (₹)', 'Balance (₹)']],
        body: tableData,
        startY: 42,
        theme: 'grid',
        headStyles: { 
            fillColor: [65, 105, 225],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
        },
        styles: { 
            fontSize: 9,
            cellPadding: 4
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left', cellWidth: 30 },
            2: { halign: 'left', cellWidth: 50 },
            3: { halign: 'center', cellWidth: 30 },
            4: { halign: 'center', cellWidth: 30 },
            5: { halign: 'center', cellWidth: 30, textColor: [239, 68, 68] }
        }
    });
    
    doc.save(`Employee_Salaries_${currentDate}.pdf`);
}

// Print function
function handlePrint() {
    window.print();
}

// Open search modal
function openSearchModal() {
    document.getElementById('searchModal').style.display = 'flex';
}

// Close search modal
function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchMonth').value = '';
    document.getElementById('searchYear').value = '';
}

// Handle search
function handleSearch() {
    const searchDate = document.getElementById('searchDate').value;
    const searchMonth = document.getElementById('searchMonth').value;
    const searchYear = document.getElementById('searchYear').value;
    
    if (!searchDate || !searchMonth || !searchYear) {
        alert('Please fill in all date fields');
        return;
    }
    
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(searchYear);
    
    if (yearNum < currentYear - 5 || yearNum > currentYear) {
        alert('You can only search data from the last 5 years');
        return;
    }
    
    const searchDateStr = `${searchYear}-${searchMonth.padStart(2, '0')}-${searchDate.padStart(2, '0')}`;
    currentDate = searchDateStr;
    
    // Update display
    document.getElementById('currentDateValue').textContent = formatDateForDisplay(currentDate);
    
    // Create empty data if doesn't exist
    if (!dataHistory[searchDateStr]) {
        dataHistory[searchDateStr] = {
            date: searchDateStr,
            employees: []
        };
        saveDataToStorage();
    }
    
    closeSearchModal();
    renderTable();
}
