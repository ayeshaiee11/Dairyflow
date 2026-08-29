// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = loadDataFromStorage();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderTable();
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
    const stored = localStorage.getItem('purchaseTableFinalData');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default data
    const today = getTodayDate();
    return {
        [today]: {
            date: today,
            purchases: [
                { id: 1, name: 'Ravi Kumar', quantity: 20, perUnitPrice: 40, total: 10, mtd: 0, totalAmountPaid: 800 },
                { id: 2, name: 'Green Fresh Store', quantity: 35, perUnitPrice: 38, total: 20, mtd: 114, totalAmountPaid: 1216 },
                { id: 3, name: 'Sunrise Bakery', quantity: 25, perUnitPrice: 42, total: 12, mtd: 84, totalAmountPaid: 966 },
                { id: 4, name: 'Enter name', quantity: 0, perUnitPrice: 0, total: 0, mtd: 0, totalAmountPaid: 0 },
                { id: 5, name: 'Enter name', quantity: 0, perUnitPrice: 0, total: 0, mtd: 0, totalAmountPaid: 0 },
                { id: 6, name: 'Enter name', quantity: 0, perUnitPrice: 0, total: 0, mtd: 0, totalAmountPaid: 0 },
                { id: 7, name: 'Enter name', quantity: 0, perUnitPrice: 0, total: 0, mtd: 0, totalAmountPaid: 0 },
                { id: 8, name: 'Enter name', quantity: 0, perUnitPrice: 0, total: 0, mtd: 0, totalAmountPaid: 0 },
                { id: 9, name: 'Enter name', quantity: 0, perUnitPrice: 0, total: 0, mtd: 0, totalAmountPaid: 0 }
            ]
        }
    };
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('purchaseTableFinalData', JSON.stringify(dataHistory));
}

// Initialize the app
function initializeApp() {
    document.getElementById('currentDateValue').textContent = currentDate;
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
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    
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
        if (e.target === this) {
            closeSearchModal();
        }
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

// Get current purchases
function getCurrentPurchases() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = {
            date: currentDate,
            purchases: []
        };
    }
    return dataHistory[currentDate].purchases;
}

// Add new row
function addRow() {
    const purchases = getCurrentPurchases();
    const newPurchase = {
        id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
        date: currentDate,
        name: 'Enter name',
        quantity: 0,
        perUnitPrice: 0,
        total: 0,
        mtd: 0,
        totalAmountPaid: 0
    };
    
    purchases.push(newPurchase);
    saveDataToStorage();
    renderTable();
}

// Delete row
function deleteRow(id) {
    if (!confirm('Are you sure you want to delete this row?')) {
        return;
    }
    
    const purchases = getCurrentPurchases();
    const index = purchases.findIndex(p => p.id === id);
    if (index > -1) {
        purchases.splice(index, 1);
        saveDataToStorage();
        renderTable();
    }
}

// Update purchase data
function updatePurchase(id, field, value) {
    const purchases = getCurrentPurchases();
    const purchase = purchases.find(p => p.id === id);
    if (purchase) {
        purchase[field] = field === 'name' ? value : parseFloat(value) || 0;
        
        // Auto-calculate Total Amount Paid
        // Total Amount Paid = (Quantity × Per Unit Price) + MTD - Total
        if (field === 'quantity' || field === 'perUnitPrice' || field === 'total' || field === 'mtd') {
            purchase.totalAmountPaid = (purchase.quantity * purchase.perUnitPrice) + purchase.mtd - purchase.total;
        }
        
        saveDataToStorage();
        renderTable();
    }
}

// Render table
function renderTable() {
    const tbody = document.getElementById('purchaseTableBody');
    const purchases = getCurrentPurchases();
    
    tbody.innerHTML = '';
    
    purchases.forEach((purchase, index) => {
        const row = document.createElement('tr');
        
        // Determine if values should show placeholder styling
        const isPlaceholder = purchase.name === 'Enter name' && purchase.quantity === 0;
        const mtdDisplay = purchase.mtd === 0 ? '₹' : purchase.mtd;
        const totalAmountDisplay = purchase.totalAmountPaid === 0 ? '₹' : purchase.totalAmountPaid;
        
        // Format date for display (DD/MM/YYYY)
        const displayDate = formatDateForDisplay(purchase.date || currentDate);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(purchase, 'date', displayDate)}</td>
            <td class="${isPlaceholder ? 'text-placeholder' : ''}">${renderCell(purchase, 'name', purchase.name, 'name')}</td>
            <td>${renderCell(purchase, 'quantity', purchase.quantity)}</td>
            <td>${renderCell(purchase, 'perUnitPrice', purchase.perUnitPrice.toFixed(2))}</td>
            <td>${renderCell(purchase, 'total', purchase.total)}</td>
            <td class="${purchase.mtd > 0 ? 'text-red' : ''}">${renderCellStatic(mtdDisplay)}</td>
            <td class="${purchase.totalAmountPaid > 0 ? 'text-green' : ''}">${renderCellStatic(totalAmountDisplay)}</td>
            <td>
                ${isEditMode ? `<button class="btn-delete" onclick="deleteRow(${purchase.id})">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners for inputs
        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                if (field === 'date') {
                    input.addEventListener('change', function() {
                        updatePurchase(purchase.id, field, this.value);
                    });
                } else {
                    input.addEventListener('change', function() {
                        updatePurchase(purchase.id, field, this.value);
                    });
                }
            });
        }
    });
}

// Format date for display (DD/MM/YYYY)
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Render date cell
function renderDateCell(purchase, field, displayValue) {
    if (isEditMode) {
        const dateValue = purchase.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input" style="text-align: center;">`;
    }
    return displayValue;
}

// Render cell (editable or static)
function renderCell(purchase, field, value, type = 'number') {
    if (isEditMode) {
        const inputType = type === 'name' ? 'text' : 'number';
        const step = type === 'number' && field === 'perUnitPrice' ? '0.01' : '1';
        const className = type === 'name' ? 'editable-input name-input' : 'editable-input';
        return `<input type="${inputType}" value="${value}" data-field="${field}" class="${className}" step="${step}">`;
    }
    return value;
}

// Render static cell
function renderCellStatic(value) {
    return value;
}

// Export to Excel
function exportToExcel() {
    const purchases = getCurrentPurchases();
    
    const data = purchases.map((purchase, index) => ({
        'S.No': index + 1,
        'Date': formatDateForDisplay(purchase.date || currentDate),
        'Purchasing': purchase.name,
        'Quantity': purchase.quantity,
        'Per Unit Price': purchase.perUnitPrice,
        'Total': purchase.total,
        'MTD': purchase.mtd === 0 ? '' : purchase.mtd,
        'Total Amount Paid (₹)': purchase.totalAmountPaid === 0 ? '' : purchase.totalAmountPaid
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Table');
    XLSX.writeFile(workbook, `Purchase_Table_${currentDate}.xlsx`);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Add title
    doc.setFontSize(18);
    doc.text('Purchase Table', 14, 15);
    doc.setFontSize(11);
    doc.text(`Date: ${currentDate}`, 14, 22);
    
    // Prepare table data
    const purchases = getCurrentPurchases();
    const tableData = purchases.map((purchase, index) => [
        index + 1,
        formatDateForDisplay(purchase.date || currentDate),
        purchase.name,
        purchase.quantity,
        purchase.perUnitPrice.toFixed(2),
        purchase.total,
        purchase.mtd === 0 ? '' : purchase.mtd,
        purchase.totalAmountPaid === 0 ? '' : purchase.totalAmountPaid
    ]);
    
    // Add table
    doc.autoTable({
        head: [[
            'S.No',
            'Date',
            'Purchasing',
            'Quantity',
            'Per Unit Price',
            'Total',
            'MTD',
            'Total Amount Paid (₹)'
        ]],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [23, 162, 184] },
        styles: { fontSize: 9 }
    });
    
    doc.save(`Purchase_Table_${currentDate}.pdf`);
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
    document.getElementById('currentDateValue').textContent = currentDate;
    
    // Create empty data if doesn't exist
    if (!dataHistory[searchDateStr]) {
        dataHistory[searchDateStr] = {
            date: searchDateStr,
            purchases: []
        };
        saveDataToStorage();
    }
    
    closeSearchModal();
    renderTable();
}