// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    renderTable();
    updateSummaryCards();
});

// Data
let expenses = [
    {
        id: 1,
        date: '15-01-2024',
        expenses: 'Milk Procurement',
        total: 15000.00,
        mtd: 12500.00,
        grandTotal: 27500.00,
    },
    {
        id: 2,
        date: '16-01-2024',
        expenses: 'Transportation',
        total: 8500.00,
        mtd: 7200.00,
        grandTotal: 15700.00,
    },
    {
        id: 3,
        date: '17-01-2024',
        expenses: 'Packaging Materials',
        total: 5200.00,
        mtd: 4800.00,
        grandTotal: 10000.00,
    },
    {
        id: 4,
        date: '18-01-2024',
        expenses: 'Electricity',
        total: 3500.00,
        mtd: 3200.00,
        grandTotal: 6700.00,
    },
    {
        id: 5,
        date: '19-01-2024',
        expenses: 'Water Supply',
        total: 2800.00,
        mtd: 2600.00,
        grandTotal: 5400.00,
    },
    {
        id: 6,
        date: '20-01-2024',
        expenses: 'Staff Salaries',
        total: 45000.00,
        mtd: 45000.00,
        grandTotal: 90000.00,
    },
];

// State
let editMode = false;
let editingId = null;
let searchQuery = '';
let dateFilter = '';
let highlightedDate = '';

// Modal Functions
function openAddModal() {
    document.getElementById('addModal').classList.add('active');
    document.getElementById('addExpenseForm').reset();
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
}

// Calendar Functions
function toggleCalendar() {
    const dropdown = document.getElementById('calendarDropdown');
    dropdown.classList.toggle('active');
    lucide.createIcons();
}

// Date Functions
function convertDateToDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}

function handleDateSearch() {
    const selectedDate = document.getElementById('searchDate').value;
    if (selectedDate) {
        const formattedDate = convertDateToDisplay(selectedDate);
        highlightedDate = formattedDate;
        dateFilter = selectedDate;
        toggleCalendar();
        document.getElementById('clearFilterBtn').style.display = 'flex';
        
        renderTable();
        
        // Scroll to matching row
        setTimeout(() => {
            const matchingRow = document.querySelector(`[data-date="${formattedDate}"]`);
            if (matchingRow) {
                matchingRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

function clearFilter() {
    dateFilter = '';
    highlightedDate = '';
    document.getElementById('searchDate').value = '';
    document.getElementById('clearFilterBtn').style.display = 'none';
    renderTable();
}

// Filter Functions
function filterExpenses() {
    searchQuery = document.getElementById('searchInput').value;
    renderTable();
}

function getFilteredExpenses() {
    return expenses.filter(exp => {
        const matchesSearch = exp.expenses.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = !dateFilter || exp.date === convertDateToDisplay(dateFilter);
        return matchesSearch && matchesDate;
    });
}

// Edit Mode Functions
function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('editModeBtn');
    if (editMode) {
        btn.classList.add('active');
        btn.innerHTML = '<i data-lucide="edit-3"></i> Edit Mode';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<i data-lucide="edit-3"></i> Edit Mode';
        // Cancel any ongoing edits
        if (editingId !== null) {
            cancelEdit();
        }
    }
    lucide.createIcons();
    renderTable();
}

function startEdit(id) {
    editingId = id;
    renderTable();
}

function saveEdit(id) {
    const dateInput = document.getElementById(`edit-date-${id}`).value;
    const expenseInput = document.getElementById(`edit-expense-${id}`).value;
    const totalInput = parseFloat(document.getElementById(`edit-total-${id}`).value) || 0;
    const mtdInput = parseFloat(document.getElementById(`edit-mtd-${id}`).value) || 0;
    
    const expenseIndex = expenses.findIndex(exp => exp.id === id);
    if (expenseIndex !== -1) {
        expenses[expenseIndex] = {
            ...expenses[expenseIndex],
            date: dateInput,
            expenses: expenseInput,
            total: totalInput,
            mtd: mtdInput,
            grandTotal: totalInput + mtdInput
        };
    }
    
    editingId = null;
    renderTable();
    updateSummaryCards();
}

function cancelEdit() {
    editingId = null;
    renderTable();
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        renderTable();
        updateSummaryCards();
    }
}

// Add Expense Function
document.getElementById('addExpenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('newDate').value;
    const expenseName = document.getElementById('newExpense').value;
    const total = parseFloat(document.getElementById('newTotal').value);
    const mtd = parseFloat(document.getElementById('newMTD').value);
    
    if (!date || !expenseName || isNaN(total) || isNaN(mtd)) {
        alert('Please fill all fields correctly');
        return;
    }
    
    const newExpense = {
        id: Math.max(...expenses.map(e => e.id), 0) + 1,
        date: convertDateToDisplay(date),
        expenses: expenseName,
        total: total,
        mtd: mtd,
        grandTotal: total + mtd
    };
    
    expenses.push(newExpense);
    closeAddModal();
    renderTable();
    updateSummaryCards();
});

// Render Table
function renderTable() {
    const tbody = document.getElementById('expenseTableBody');
    const filteredExpenses = getFilteredExpenses();
    
    // Update record count
    document.getElementById('recordsCount').textContent = `${filteredExpenses.length} expenses`;
    
    let html = '';
    
    filteredExpenses.forEach((expense, index) => {
        const isHighlighted = highlightedDate && expense.date === highlightedDate;
        const isEditing = editingId === expense.id;
        const rowClass = isHighlighted ? 'highlighted' : '';
        
        html += `<tr class="${rowClass}" data-date="${expense.date}">`;
        html += `<td>${index + 1}</td>`;
        
        // Date column
        if (isEditing) {
            html += `<td><input type="text" id="edit-date-${expense.id}" class="edit-input" value="${expense.date}"></td>`;
        } else {
            html += `<td>${expense.date}</td>`;
        }
        
        // Expenses column
        if (isEditing) {
            html += `<td><input type="text" id="edit-expense-${expense.id}" class="edit-input" value="${expense.expenses}"></td>`;
        } else {
            html += `<td>${expense.expenses}</td>`;
        }
        
        // Total column
        if (isEditing) {
            html += `<td><input type="number" step="0.01" id="edit-total-${expense.id}" class="edit-input" value="${expense.total}" onchange="updateGrandTotal(${expense.id})"></td>`;
        } else {
            html += `<td>${expense.total.toFixed(2)}</td>`;
        }
        
        // MTD column
        if (isEditing) {
            html += `<td><input type="number" step="0.01" id="edit-mtd-${expense.id}" class="edit-input" value="${expense.mtd}" onchange="updateGrandTotal(${expense.id})"></td>`;
        } else {
            html += `<td>${expense.mtd.toFixed(2)}</td>`;
        }
        
        // Grand Total column
        if (isEditing) {
            html += `<td><span id="edit-grandtotal-${expense.id}" class="font-semibold">${expense.grandTotal.toFixed(2)}</span></td>`;
        } else {
            html += `<td>${expense.grandTotal.toFixed(2)}</td>`;
        }
        
        // Action column
        html += `<td class="no-print">`;
        html += `<div class="action-buttons-cell">`;
        if (isEditing) {
            html += `<button class="btn btn-small btn-green" onclick="saveEdit(${expense.id})">
                        <i data-lucide="save"></i> Save
                     </button>`;
            html += `<button class="btn btn-small btn-gray" onclick="cancelEdit()">Cancel</button>`;
        } else {
            html += `<button class="btn btn-small btn-yellow" ${!editMode ? 'disabled' : ''} onclick="startEdit(${expense.id})">Edit</button>`;
            html += `<button class="btn btn-small btn-red" ${!editMode ? 'disabled' : ''} onclick="deleteExpense(${expense.id})">Delete</button>`;
        }
        html += `</div>`;
        html += `</td>`;
        html += `</tr>`;
    });
    
    // Add total row
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = filteredExpenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = filteredExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    html += `<tr class="total-row">`;
    html += `<td colspan="3">Total</td>`;
    html += `<td class="total-value">₹${totalExpenses.toFixed(2)}</td>`;
    html += `<td class="total-value">₹${totalMTD.toFixed(2)}</td>`;
    html += `<td class="total-value">₹${totalGrandTotal.toFixed(2)}</td>`;
    html += `<td class="no-print"></td>`;
    html += `</tr>`;
    
    tbody.innerHTML = html;
    lucide.createIcons();
}

function updateGrandTotal(id) {
    const total = parseFloat(document.getElementById(`edit-total-${id}`).value) || 0;
    const mtd = parseFloat(document.getElementById(`edit-mtd-${id}`).value) || 0;
    document.getElementById(`edit-grandtotal-${id}`).textContent = (total + mtd).toFixed(2);
}

// Update Summary Cards
function updateSummaryCards() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = expenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = expenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById('totalMTD').textContent = `₹${totalMTD.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `₹${totalGrandTotal.toFixed(2)}`;
}

// Export to Excel (CSV)
function exportToExcel() {
    const filteredExpenses = getFilteredExpenses();
    const headers = ['S.No', 'Date', 'Expenses', 'Total (₹)', 'MTD (₹)', 'Grand Total (₹)'];
    const rows = filteredExpenses.map((exp, index) => [
        index + 1,
        exp.date,
        exp.expenses,
        exp.total.toFixed(2),
        exp.mtd.toFixed(2),
        exp.grandTotal.toFixed(2),
    ]);
    
    // Add totals row
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = filteredExpenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = filteredExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    rows.push([
        '',
        '',
        'Total',
        totalExpenses.toFixed(2),
        totalMTD.toFixed(2),
        totalGrandTotal.toFixed(2),
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const filteredExpenses = getFilteredExpenses();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Expenses - Dairy Flow', 14, 22);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableData = filteredExpenses.map((exp, index) => [
        index + 1,
        exp.date,
        exp.expenses,
        `₹${exp.total.toFixed(2)}`,
        `₹${exp.mtd.toFixed(2)}`,
        `₹${exp.grandTotal.toFixed(2)}`,
    ]);
    
    // Add totals row
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.total, 0);
    const totalMTD = filteredExpenses.reduce((sum, exp) => sum + exp.mtd, 0);
    const totalGrandTotal = filteredExpenses.reduce((sum, exp) => sum + exp.grandTotal, 0);
    
    tableData.push([
        '',
        '',
        'Total',
        `₹${totalExpenses.toFixed(2)}`,
        `₹${totalMTD.toFixed(2)}`,
        `₹${totalGrandTotal.toFixed(2)}`,
    ]);
    
    // Add table
    doc.autoTable({
        head: [['S.No', 'Date', 'Expenses', 'Total (₹)', 'MTD (₹)', 'Grand Total (₹)']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        footStyles: { fillColor: [219, 234, 254], textColor: [30, 64, 175], fontStyle: 'bold' },
    });
    
    // Save PDF
    doc.save(`expenses_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Print
function handlePrint() {
    window.print();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addModal');
    if (event.target === modal) {
        closeAddModal();
    }
}
