// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = loadDataFromStorage();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderTable();
    updateGrandTotal();
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
    const stored = localStorage.getItem('summaryDairyFlowData');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default data
    const today = getTodayDate();
    return {
        [today]: {
            date: today,
            rows: [
                { id: 1, date: today, description: 'Total Sales', amount: 10000.00 },
                { id: 2, date: today, description: 'Total Expenses', amount: 5000.00 },
                { id: 3, date: today, description: 'Net Profit', amount: 5000.00 }
            ]
        }
    };
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('summaryDairyFlowData', JSON.stringify(dataHistory));
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
    
    // Add Row Button
    document.getElementById('addRowBtn').addEventListener('click', openAddRowModal);
    
    // Export Buttons
    document.getElementById('excelBtn').addEventListener('click', exportToExcel);
    document.getElementById('pdfBtn').addEventListener('click', exportToPDF);
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    
    // Search Modal
    document.getElementById('searchDataBtn').addEventListener('click', openSearchModal);
    document.getElementById('cancelSearchBtn').addEventListener('click', closeSearchModal);
    document.getElementById('confirmSearchBtn').addEventListener('click', handleSearch);
    
    // Add Row Modal
    document.getElementById('cancelAddRowBtn').addEventListener('click', closeAddRowModal);
    document.getElementById('confirmAddRowBtn').addEventListener('click', handleAddRow);
    
    // Close modals on overlay click
    document.getElementById('searchModal').addEventListener('click', function(e) {
        if (e.target === this) closeSearchModal();
    });
    document.getElementById('addRowModal').addEventListener('click', function(e) {
        if (e.target === this) closeAddRowModal();
    });
}

// Toggle Edit Mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editModeBtn');
    const addRowBtn = document.getElementById('addRowBtn');
    
    if (isEditMode) {
        editBtn.classList.add('active');
        addRowBtn.style.display = 'flex';
    } else {
        editBtn.classList.remove('active');
        addRowBtn.style.display = 'none';
    }
    
    renderTable();
}

// Get current data
function getCurrentData() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = {
            date: currentDate,
            rows: []
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

// Update grand total
function updateGrandTotal() {
    const data = getCurrentData();
    let total = 0;
    
    data.rows.forEach(row => {
        total += parseFloat(row.amount) || 0;
    });
    
    document.getElementById('grandTotalValue').textContent = '₹' + total.toFixed(2);
}

// Render table
function renderTable() {
    const tbody = document.getElementById('summaryTableBody');
    const data = getCurrentData();
    
    tbody.innerHTML = '';
    
    data.rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        const displayDate = formatDateForDisplay(row.date || currentDate);
        
        tr.innerHTML = `
            <td>${renderCell(row, 'description', row.description, 'text')}</td>
            <td>${renderDateCell(row, 'date', displayDate)}</td>
            <td class="text-right">${renderCell(row, 'amount', '₹' + row.amount.toFixed(2), 'amount')}</td>
            <td>
                ${isEditMode ? `<button class="btn btn-delete" onclick="handleDelete(${row.id})">Delete</button>` : ''}
            </td>
        `;
        
        tbody.appendChild(tr);
        
        // Add event listeners for editable inputs
        if (isEditMode) {
            const inputs = tr.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', function() {
                    updateRow(row.id, field, this.value);
                });
            });
        }
    });
    
    updateGrandTotal();
}

// Render date cell
function renderDateCell(row, field, displayValue) {
    if (isEditMode) {
        const dateValue = row.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input">`;
    }
    return displayValue;
}

// Render cell
function renderCell(row, field, value, type) {
    if (isEditMode) {
        if (type === 'text') {
            return `<input type="text" value="${value}" data-field="${field}" class="editable-input description-input">`;
        } else if (type === 'amount') {
            const numericValue = parseFloat(value.replace('₹', '')) || 0;
            return `<input type="number" value="${numericValue}" data-field="${field}" class="editable-input amount-input" step="0.01">`;
        }
    }
    return value;
}

// Update row
function updateRow(id, field, value) {
    const data = getCurrentData();
    const row = data.rows.find(r => r.id === id);
    
    if (row) {
        if (field === 'description') {
            row[field] = value;
        } else if (field === 'amount') {
            row[field] = parseFloat(value) || 0;
        } else if (field === 'date') {
            row[field] = value;
        }
        
        saveDataToStorage();
        renderTable();
    }
}

// Handle Delete
function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this row?')) {
        return;
    }
    
    const data = getCurrentData();
    const index = data.rows.findIndex(r => r.id === id);
    
    if (index > -1) {
        data.rows.splice(index, 1);
        saveDataToStorage();
        renderTable();
    }
}

// Open Add Row Modal
function openAddRowModal() {
    document.getElementById('addRowModal').style.display = 'flex';
}

// Close Add Row Modal
function closeAddRowModal() {
    document.getElementById('addRowModal').style.display = 'none';
    document.getElementById('rowDescription').value = '';
    document.getElementById('rowAmount').value = '';
}

// Handle Add Row
function handleAddRow() {
    const description = document.getElementById('rowDescription').value.trim();
    const amount = parseFloat(document.getElementById('rowAmount').value) || 0;
    
    if (!description) {
        alert('Please enter a description');
        return;
    }
    
    const data = getCurrentData();
    const newRow = {
        id: data.rows.length > 0 ? Math.max(...data.rows.map(r => r.id)) + 1 : 1,
        date: currentDate,
        description: description,
        amount: amount
    };
    
    data.rows.push(newRow);
    saveDataToStorage();
    renderTable();
    closeAddRowModal();
}

// Export to Excel
function exportToExcel() {
    const data = getCurrentData();
    
    const excelData = data.rows.map((row, index) => ({
        'Description': row.description,
        'Date': formatDateForDisplay(row.date || currentDate),
        'Amount (₹)': row.amount.toFixed(2)
    }));
    
    // Calculate total
    let total = 0;
    data.rows.forEach(row => {
        total += parseFloat(row.amount) || 0;
    });
    
    excelData.push({
        'Description': 'Grand Total',
        'Date': '',
        'Amount (₹)': total.toFixed(2)
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
    
    XLSX.writeFile(workbook, `Summary_Dairy_Flow_${currentDate}.xlsx`);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('SUMMARY - Dairy Flow', 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 28);
    
    const data = getCurrentData();
    
    // Prepare table data
    const tableData = data.rows.map((row, index) => [
        row.description,
        formatDateForDisplay(row.date || currentDate),
        '₹' + row.amount.toFixed(2)
    ]);
    
    // Calculate total
    let total = 0;
    data.rows.forEach(row => {
        total += parseFloat(row.amount) || 0;
    });
    
    // Add table
    doc.autoTable({
        head: [['Total Summary', 'Date', 'Total INR']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { 
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
        },
        styles: { 
            fontSize: 10,
            cellPadding: 5
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 50, halign: 'left' },
            2: { cellWidth: 50, halign: 'right' }
        }
    });
    
    // Add grand total row
    const finalY = doc.lastAutoTable.finalY;
    
    doc.setFillColor(37, 99, 235);
    doc.rect(14, finalY, doc.internal.pageSize.width - 28, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Grand Total', 16, finalY + 7);
    doc.text('₹' + total.toFixed(2), doc.internal.pageSize.width - 16, finalY + 7, { align: 'right' });
    
    doc.save(`Summary_Dairy_Flow_${currentDate}.pdf`);
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
            rows: []
        };
        saveDataToStorage();
    }
    
    closeSearchModal();
    renderTable();
}