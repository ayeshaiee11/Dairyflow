// Global Variables
let isEditMode = false;
let currentDate = getTodayDate();
let dataHistory = loadDataFromStorage();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderTable();
    updateSummaryCards();
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
    const stored = localStorage.getItem('productionDairyManagementData');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default data
    const today = getTodayDate();
    return {
        [today]: {
            date: today,
            buffaloes: [
                { id: 1, date: today, name: 'Buffalo 1', am: 5.50, pm: 6.00 },
                { id: 2, date: today, name: 'Buffalo 2', am: 4.75, pm: 5.25 },
                { id: 3, date: today, name: 'Buffalo 3', am: 6.00, pm: 6.50 },
                { id: 4, date: today, name: 'Buffalo 4', am: 5.25, pm: 5.75 },
                { id: 5, date: today, name: 'Buffalo 5', am: 4.50, pm: 5.00 }
            ]
        }
    };
}

// Save data to localStorage
function saveDataToStorage() {
    localStorage.setItem('productionDairyManagementData', JSON.stringify(dataHistory));
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
    
    // Add Production Button
    document.getElementById('addProductionBtn').addEventListener('click', addProduction);
    
    // Add New Buffalo Button (shows/clears input)
    document.getElementById('addNewBuffaloBtn').addEventListener('click', clearInputs);
    
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
    const addBuffaloSection = document.getElementById('addBuffaloSection');
    
    if (isEditMode) {
        editBtn.classList.add('active');
        addBuffaloSection.style.display = 'grid';
    } else {
        editBtn.classList.remove('active');
        addBuffaloSection.style.display = 'none';
    }
    
    renderTable();
}

// Get current buffaloes
function getCurrentBuffaloes() {
    if (!dataHistory[currentDate]) {
        dataHistory[currentDate] = {
            date: currentDate,
            buffaloes: []
        };
    }
    return dataHistory[currentDate].buffaloes;
}

// Clear input fields
function clearInputs() {
    document.getElementById('buffaloNameInput').value = '';
    document.getElementById('amLitersInput').value = '';
    document.getElementById('pmLitersInput').value = '';
}

// Add new production/buffalo
function addProduction() {
    const name = document.getElementById('buffaloNameInput').value.trim();
    const am = parseFloat(document.getElementById('amLitersInput').value) || 0;
    const pm = parseFloat(document.getElementById('pmLitersInput').value) || 0;
    
    if (!name) {
        alert('Please enter a buffalo name');
        return;
    }
    
    const buffaloes = getCurrentBuffaloes();
    const newBuffalo = {
        id: buffaloes.length > 0 ? Math.max(...buffaloes.map(b => b.id)) + 1 : 1,
        date: currentDate,
        name: name,
        am: am,
        pm: pm
    };
    
    buffaloes.push(newBuffalo);
    saveDataToStorage();
    clearInputs();
    renderTable();
    updateSummaryCards();
}

// Delete buffalo
function deleteBuffalo(id) {
    if (!confirm('Are you sure you want to delete this buffalo?')) {
        return;
    }
    
    const buffaloes = getCurrentBuffaloes();
    const index = buffaloes.findIndex(b => b.id === id);
    if (index > -1) {
        buffaloes.splice(index, 1);
        saveDataToStorage();
        renderTable();
        updateSummaryCards();
    }
}

// Update buffalo data
function updateBuffalo(id, field, value) {
    const buffaloes = getCurrentBuffaloes();
    const buffalo = buffaloes.find(b => b.id === id);
    if (buffalo) {
        if (field === 'name') {
            buffalo[field] = value;
        } else {
            buffalo[field] = parseFloat(value) || 0;
        }
        
        saveDataToStorage();
        renderTable();
        updateSummaryCards();
    }
}

// Calculate total for a buffalo
function calculateTotal(am, pm) {
    return (parseFloat(am) || 0) + (parseFloat(pm) || 0);
}

// Update summary cards
function updateSummaryCards() {
    const buffaloes = getCurrentBuffaloes();
    
    let totalAM = 0;
    let totalPM = 0;
    
    buffaloes.forEach(buffalo => {
        totalAM += parseFloat(buffalo.am) || 0;
        totalPM += parseFloat(buffalo.pm) || 0;
    });
    
    const grandTotal = totalAM + totalPM;
    
    document.getElementById('totalAMProduction').textContent = totalAM.toFixed(2) + ' Liters';
    document.getElementById('totalPMProduction').textContent = totalPM.toFixed(2) + ' Liters';
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2) + ' Liters';
    document.getElementById('buffaloCount').textContent = buffaloes.length + ' buffaloes';
    
    // Update footer
    document.getElementById('footerTotalAM').textContent = totalAM.toFixed(2);
    document.getElementById('footerTotalPM').textContent = totalPM.toFixed(2);
    document.getElementById('footerGrandTotal').textContent = grandTotal.toFixed(2);
}

// Render table
function renderTable() {
    const tbody = document.getElementById('productionTableBody');
    const buffaloes = getCurrentBuffaloes();
    
    tbody.innerHTML = '';
    
    buffaloes.forEach((buffalo, index) => {
        const row = document.createElement('tr');
        const total = calculateTotal(buffalo.am, buffalo.pm);
        
        // Format date for display (DD/MM/YYYY)
        const displayDate = formatDateForDisplay(buffalo.date || currentDate);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${renderDateCell(buffalo, 'date', displayDate)}</td>
            <td>${renderCell(buffalo, 'name', buffalo.name, 'name')}</td>
            <td>${renderCell(buffalo, 'am', buffalo.am.toFixed(2))}</td>
            <td>${renderCell(buffalo, 'pm', buffalo.pm.toFixed(2))}</td>
            <td>${total.toFixed(2)}</td>
            <td>
                ${isEditMode ? `<button class="btn-delete" onclick="deleteBuffalo(${buffalo.id})">Delete</button>` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners for inputs
        if (isEditMode) {
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.addEventListener('change', function() {
                    updateBuffalo(buffalo.id, field, this.value);
                });
            });
        }
    });
    
    updateSummaryCards();
}

// Render date cell
function renderDateCell(buffalo, field, displayValue) {
    if (isEditMode) {
        const dateValue = buffalo.date || currentDate;
        return `<input type="date" value="${dateValue}" data-field="${field}" class="editable-input" style="text-align: center;">`;
    }
    return displayValue;
}

// Render cell (editable or static)
function renderCell(buffalo, field, value, type = 'number') {
    if (isEditMode) {
        const inputType = type === 'name' ? 'text' : 'number';
        const step = type === 'number' ? '0.01' : '';
        const className = type === 'name' ? 'editable-input name-input' : 'editable-input';
        return `<input type="${inputType}" value="${value}" data-field="${field}" class="${className}" step="${step}">`;
    }
    return value;
}

// Format date for display (DD/MM/YYYY)
function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Export to Excel
function exportToExcel() {
    const buffaloes = getCurrentBuffaloes();
    
    const data = buffaloes.map((buffalo, index) => ({
        'Sl No.': index + 1,
        'Date': formatDateForDisplay(buffalo.date || currentDate),
        'Buffalo': buffalo.name,
        'AM (Liters)': buffalo.am,
        'PM (Liters)': buffalo.pm,
        'Total (Liters)': calculateTotal(buffalo.am, buffalo.pm).toFixed(2)
    }));
    
    // Add total row
    const buffaloesList = getCurrentBuffaloes();
    let totalAM = 0;
    let totalPM = 0;
    buffaloesList.forEach(b => {
        totalAM += parseFloat(b.am) || 0;
        totalPM += parseFloat(b.pm) || 0;
    });
    
    data.push({
        'Sl No.': '',
        'Date': '',
        'Buffalo': 'TOTAL:',
        'AM (Liters)': totalAM.toFixed(2),
        'PM (Liters)': totalPM.toFixed(2),
        'Total (Liters)': (totalAM + totalPM).toFixed(2)
    });
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Records');
    XLSX.writeFile(workbook, `Production_Dairy_${currentDate}.xlsx`);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Production - Dairy Management', 14, 15);
    doc.setFontSize(11);
    doc.text(`Date: ${formatDateForDisplay(currentDate)}`, 14, 22);
    
    const buffaloes = getCurrentBuffaloes();
    let totalAM = 0;
    let totalPM = 0;
    
    // Prepare table data
    const tableData = buffaloes.map((buffalo, index) => {
        totalAM += parseFloat(buffalo.am) || 0;
        totalPM += parseFloat(buffalo.pm) || 0;
        return [
            index + 1,
            formatDateForDisplay(buffalo.date || currentDate),
            buffalo.name,
            buffalo.am.toFixed(2),
            buffalo.pm.toFixed(2),
            calculateTotal(buffalo.am, buffalo.pm).toFixed(2)
        ];
    });
    
    // Add total row
    tableData.push([
        '',
        '',
        'TOTAL:',
        totalAM.toFixed(2),
        totalPM.toFixed(2),
        (totalAM + totalPM).toFixed(2)
    ]);
    
    // Add table
    doc.autoTable({
        head: [[
            'Sl No.',
            'Date',
            'Buffalo',
            'AM (Liters)',
            'PM (Liters)',
            'Total (Liters)'
        ]],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [65, 105, 225] },
        styles: { fontSize: 10 }
    });
    
    // Add summary
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total AM Production: ${totalAM.toFixed(2)} Liters`, 14, finalY);
    doc.text(`Total PM Production: ${totalPM.toFixed(2)} Liters`, 14, finalY + 7);
    doc.text(`Grand Total: ${(totalAM + totalPM).toFixed(2)} Liters`, 14, finalY + 14);
    
    doc.save(`Production_Dairy_${currentDate}.pdf`);
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
            buffaloes: []
        };
        saveDataToStorage();
    }
    
    closeSearchModal();
    renderTable();
    updateSummaryCards();
}