// Initial customer data with dates
let customers = [
    {
        id: 1,
        name: 'b no. 1',
        date: '2026-01-06',
        litres: { mtd: 20, today: 14, total: 34 },
        sales: { mtd: 5000.04, today: 1000, total: 6000.04 },
        paid: { mtd: 3000, today: 500, total: 3500 },
        credit: { today: 500, mtd: 2000, total: 2500 }
    },
    {
        id: 2,
        name: 'Enter custo',
        date: '2026-01-05',
        litres: { mtd: 0, today: 0, total: 0 },
        sales: { mtd: 0, today: 0, total: 0 },
        paid: { mtd: 0, today: 0, total: 0 },
        credit: { today: 0, mtd: 0, total: 0 }
    },
    {
        id: 3,
        name: 'Enter custo',
        date: '2026-01-04',
        litres: { mtd: 0, today: 0, total: 0 },
        sales: { mtd: 0, today: 0, total: 0 },
        paid: { mtd: 0, today: 0, total: 0 },
        credit: { today: 0, mtd: 0, total: 0 }
    }
];

let allCustomers = [...customers]; // Keep original data for filtering
let selectedDate = ''; // Currently selected date for filtering
let editMode = false; // Edit mode state

// Calculate grand total for a specific field and category
function calculateGrandTotal(field, category) {
    return customers.reduce((sum, customer) => {
        return sum + (customer[category][field] || 0);
    }, 0);
}

// Filter customers by date
function filterByDate() {
    const dateInput = document.getElementById('dateSearch');
    selectedDate = dateInput.value;
    
    if (selectedDate) {
        customers = allCustomers.filter(customer => customer.date === selectedDate);
    } else {
        customers = [...allCustomers];
    }
    
    renderTable();
}

// Clear date filter
function clearDateFilter() {
    document.getElementById('dateSearch').value = '';
    selectedDate = '';
    customers = [...allCustomers];
    renderTable();
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Make cell editable (for numbers)
function makeEditable(event, customerId, field, category) {
    if (!editMode) return;

    const cell = event.target;
    const customer = customers.find(c => c.id === customerId);
    const allCustomer = allCustomers.find(c => c.id === customerId);
    if (!customer || !allCustomer) return;

    const currentValue = customer[category][field];
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentValue;
    input.step = '0.01';
    input.style.width = '100%';
    input.style.padding = '0.25rem';
    input.style.border = '2px solid #3b82f6';
    input.style.borderRadius = '4px';
    input.style.textAlign = 'center';

    input.onblur = function() {
        const newValue = parseFloat(input.value) || 0;
        customer[category][field] = newValue;
        allCustomer[category][field] = newValue;
        
        // Recalculate totals
        if (field !== 'total') {
            if (category === 'litres') {
                customer.litres.total = customer.litres.mtd + customer.litres.today;
                allCustomer.litres.total = allCustomer.litres.mtd + allCustomer.litres.today;
            } else if (category === 'sales') {
                customer.sales.total = customer.sales.mtd + customer.sales.today;
                allCustomer.sales.total = allCustomer.sales.mtd + allCustomer.sales.today;
            } else if (category === 'paid') {
                customer.paid.total = customer.paid.mtd + customer.paid.today;
                allCustomer.paid.total = allCustomer.paid.mtd + allCustomer.paid.today;
            } else if (category === 'credit') {
                customer.credit.total = customer.credit.mtd + customer.credit.today;
                allCustomer.credit.total = allCustomer.credit.mtd + allCustomer.credit.today;
            }
        }
        
        renderTable();
    };

    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    };

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
}

// Make name editable
function makeEditableName(event, customerId) {
    if (!editMode) return;

    const cell = event.target;
    const customer = customers.find(c => c.id === customerId);
    const allCustomer = allCustomers.find(c => c.id === customerId);
    if (!customer || !allCustomer) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = customer.name;
    input.style.width = '100%';
    input.style.padding = '0.25rem';
    input.style.border = '2px solid #3b82f6';
    input.style.borderRadius = '4px';

    input.onblur = function() {
        customer.name = input.value || 'Enter customer name';
        allCustomer.name = input.value || 'Enter customer name';
        renderTable();
    };

    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            input.blur();
        }
    };

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
}

// Make date editable
function makeEditableDate(event, customerId) {
    if (!editMode) return;

    const cell = event.target;
    const customer = customers.find(c => c.id === customerId);
    const allCustomer = allCustomers.find(c => c.id === customerId);
    if (!customer || !allCustomer) return;

    const input = document.createElement('input');
    input.type = 'date';
    input.value = customer.date;
    input.style.width = '100%';
    input.style.padding = '0.25rem';
    input.style.border = '2px solid #3b82f6';
    input.style.borderRadius = '4px';

    input.onblur = function() {
        customer.date = input.value || customer.date;
        allCustomer.date = input.value || allCustomer.date;
        renderTable();
    };

    input.onchange = function() {
        customer.date = input.value || customer.date;
        allCustomer.date = input.value || allCustomer.date;
        renderTable();
    };

    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
}

// Render table rows
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const editableClass = editMode ? 'editable' : '';
    const cursorStyle = editMode ? 'cursor: pointer;' : '';

    // Render customer rows
    customers.forEach((customer) => {
        const row = document.createElement('tr');
        
        // S.No
        const cell0 = document.createElement('td');
        cell0.textContent = customer.id;
        row.appendChild(cell0);
        
        // Name (editable)
        const cell1 = document.createElement('td');
        cell1.textContent = customer.name;
        cell1.className = editableClass;
        cell1.style.cssText = cursorStyle;
        cell1.addEventListener('click', (e) => makeEditableName(e, customer.id));
        row.appendChild(cell1);
        
        // Date (editable)
        const cell2 = document.createElement('td');
        cell2.textContent = formatDate(customer.date);
        cell2.className = editableClass;
        cell2.style.cssText = cursorStyle;
        cell2.addEventListener('click', (e) => makeEditableDate(e, customer.id));
        row.appendChild(cell2);
        
        // Litres MTD (editable)
        const cell3 = document.createElement('td');
        cell3.textContent = customer.litres.mtd;
        cell3.className = editableClass;
        cell3.style.cssText = cursorStyle;
        cell3.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'litres'));
        row.appendChild(cell3);
        
        // Litres Today (editable)
        const cell4 = document.createElement('td');
        cell4.textContent = customer.litres.today;
        cell4.className = editableClass;
        cell4.style.cssText = cursorStyle;
        cell4.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'litres'));
        row.appendChild(cell4);
        
        // Litres Total (not editable)
        const cell5 = document.createElement('td');
        cell5.textContent = customer.litres.total.toFixed(2);
        cell5.className = 'value-total';
        row.appendChild(cell5);
        
        // Sales MTD (editable)
        const cell6 = document.createElement('td');
        cell6.textContent = customer.sales.mtd;
        cell6.className = editableClass;
        cell6.style.cssText = cursorStyle;
        cell6.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'sales'));
        row.appendChild(cell6);
        
        // Sales Today (editable)
        const cell7 = document.createElement('td');
        cell7.textContent = customer.sales.today;
        cell7.className = editableClass;
        cell7.style.cssText = cursorStyle;
        cell7.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'sales'));
        row.appendChild(cell7);
        
        // Sales Total (not editable)
        const cell8 = document.createElement('td');
        cell8.textContent = '₹' + customer.sales.total.toFixed(2);
        cell8.className = 'value-total';
        row.appendChild(cell8);
        
        // Paid MTD (editable)
        const cell9 = document.createElement('td');
        cell9.textContent = customer.paid.mtd;
        cell9.className = editableClass;
        cell9.style.cssText = cursorStyle;
        cell9.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'paid'));
        row.appendChild(cell9);
        
        // Paid Today (editable)
        const cell10 = document.createElement('td');
        cell10.textContent = customer.paid.today;
        cell10.className = editableClass;
        cell10.style.cssText = cursorStyle;
        cell10.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'paid'));
        row.appendChild(cell10);
        
        // Paid Total (not editable)
        const cell11 = document.createElement('td');
        cell11.textContent = '₹' + customer.paid.total.toFixed(2);
        cell11.className = 'value-total';
        row.appendChild(cell11);
        
        // Credit Today (editable)
        const cell12 = document.createElement('td');
        cell12.textContent = customer.credit.today;
        cell12.className = editableClass;
        cell12.style.cssText = cursorStyle;
        cell12.addEventListener('click', (e) => makeEditable(e, customer.id, 'today', 'credit'));
        row.appendChild(cell12);
        
        // Credit MTD (editable)
        const cell13 = document.createElement('td');
        cell13.textContent = customer.credit.mtd;
        cell13.className = editableClass;
        cell13.style.cssText = cursorStyle;
        cell13.addEventListener('click', (e) => makeEditable(e, customer.id, 'mtd', 'credit'));
        row.appendChild(cell13);
        
        // Credit Total (not editable)
        const cell14 = document.createElement('td');
        cell14.textContent = '₹' + customer.credit.total.toFixed(2);
        cell14.className = 'value-total';
        row.appendChild(cell14);
        
        // Actions (Delete button)
        const cell15 = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
        deleteBtn.addEventListener('click', () => deleteCustomer(customer.id));
        cell15.appendChild(deleteBtn);
        row.appendChild(cell15);
        
        tbody.appendChild(row);
    });

    // Render grand total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
        <td colspan="3">GRAND TOTAL</td>
        <td>${calculateGrandTotal('mtd', 'litres').toFixed(2)}</td>
        <td>${calculateGrandTotal('today', 'litres').toFixed(2)}</td>
        <td>${calculateGrandTotal('total', 'litres').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('mtd', 'sales').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('today', 'sales').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('total', 'sales').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('mtd', 'paid').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('today', 'paid').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('total', 'paid').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('today', 'credit').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('mtd', 'credit').toFixed(2)}</td>
        <td>₹${calculateGrandTotal('total', 'credit').toFixed(2)}</td>
        <td></td>
    `;
    tbody.appendChild(totalRow);

    // Re-initialize Lucide icons for new elements
    lucide.createIcons();

    // Update summary cards
    updateSummary();
}

// Update summary cards
function updateSummary() {
    document.getElementById('totalCustomers').textContent = customers.length;
    document.getElementById('totalLitres').textContent = calculateGrandTotal('total', 'litres').toFixed(2) + ' L';
    document.getElementById('totalSales').textContent = '₹' + calculateGrandTotal('total', 'sales').toFixed(2);
    document.getElementById('totalCredit').textContent = '₹' + calculateGrandTotal('total', 'credit').toFixed(2);
}

// Add new customer
function addCustomer() {
    const newId = allCustomers.length > 0 ? Math.max(...allCustomers.map(c => c.id)) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];
    const newCustomer = {
        id: newId,
        name: 'Enter customer name',
        date: today,
        litres: { mtd: 0, today: 0, total: 0 },
        sales: { mtd: 0, today: 0, total: 0 },
        paid: { mtd: 0, today: 0, total: 0 },
        credit: { today: 0, mtd: 0, total: 0 }
    };
    allCustomers.push(newCustomer);
    
    // If filtering by date, only show if it matches
    if (selectedDate) {
        if (newCustomer.date === selectedDate) {
            customers.push(newCustomer);
        }
    } else {
        customers.push(newCustomer);
    }
    
    // Automatically enable edit mode when adding a customer
    if (!editMode) {
        editMode = true;
        const btn = document.querySelector('.btn-edit');
        btn.style.backgroundColor = '#2ECC71';
        btn.innerHTML = '<i data-lucide="check-circle" class="icon-medium"></i> Edit Mode ON';
    }
    
    renderTable();
}

// Delete customer
function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        allCustomers = allCustomers.filter(customer => customer.id !== id);
        customers = customers.filter(customer => customer.id !== id);
        renderTable();
    }
}

// Button handlers
function handleEditMode() {
    editMode = !editMode;
    const btn = document.querySelector('.btn-edit');
    
    if (editMode) {
        btn.style.backgroundColor = '#2ECC71';
        btn.innerHTML = '<i data-lucide="check-circle" class="icon-medium"></i> Edit Mode ON';
        lucide.createIcons();
    } else {
        btn.style.backgroundColor = '#6B7A8F';
        btn.innerHTML = '<i data-lucide="file-text" class="icon-medium"></i> Edit Mode';
        lucide.createIcons();
    }
    
    renderTable();
}

// Excel Export using XLSX library
function handleExcel() {
    try {
        // Prepare data for Excel
        const excelData = [];
        
        // Add title
        excelData.push(['Dairy Farm Balance Sheet']);
        excelData.push(['Customer Transaction Records']);
        if (selectedDate) {
            excelData.push(['Filtered by Date: ' + formatDate(selectedDate)]);
        }
        excelData.push([]); // Empty row
        
        // Add headers
        excelData.push([
            'S.No',
            'Customer Name',
            'Date',
            'Litres MTD',
            'Litres Today',
            'Litres Total',
            'Sales MTD (₹)',
            'Sales Today (₹)',
            'Sales Total (₹)',
            'Paid MTD (₹)',
            'Paid Today (₹)',
            'Paid Total (₹)',
            'Credit Today (₹)',
            'Credit MTD (₹)',
            'Credit Total (₹)'
        ]);
        
        // Add customer data
        customers.forEach(customer => {
            excelData.push([
                customer.id,
                customer.name,
                customer.date,
                customer.litres.mtd,
                customer.litres.today,
                customer.litres.total,
                customer.sales.mtd,
                customer.sales.today,
                customer.sales.total,
                customer.paid.mtd,
                customer.paid.today,
                customer.paid.total,
                customer.credit.today,
                customer.credit.mtd,
                customer.credit.total
            ]);
        });
        
        // Add grand total row
        excelData.push([
            'GRAND TOTAL',
            '',
            '',
            calculateGrandTotal('mtd', 'litres').toFixed(2),
            calculateGrandTotal('today', 'litres').toFixed(2),
            calculateGrandTotal('total', 'litres').toFixed(2),
            calculateGrandTotal('mtd', 'sales').toFixed(2),
            calculateGrandTotal('today', 'sales').toFixed(2),
            calculateGrandTotal('total', 'sales').toFixed(2),
            calculateGrandTotal('mtd', 'paid').toFixed(2),
            calculateGrandTotal('today', 'paid').toFixed(2),
            calculateGrandTotal('total', 'paid').toFixed(2),
            calculateGrandTotal('today', 'credit').toFixed(2),
            calculateGrandTotal('mtd', 'credit').toFixed(2),
            calculateGrandTotal('total', 'credit').toFixed(2)
        ]);
        
        // Add summary
        excelData.push([]);
        excelData.push(['Summary']);
        excelData.push(['Total Customers', customers.length]);
        excelData.push(['Total Litres', calculateGrandTotal('total', 'litres').toFixed(2) + ' L']);
        excelData.push(['Total Sales', '₹' + calculateGrandTotal('total', 'sales').toFixed(2)]);
        excelData.push(['Outstanding Credit', '₹' + calculateGrandTotal('total', 'credit').toFixed(2)]);
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 8 },  // S.No
            { wch: 20 }, // Customer Name
            { wch: 12 }, // Date
            { wch: 12 }, // Litres MTD
            { wch: 12 }, // Litres Today
            { wch: 12 }, // Litres Total
            { wch: 15 }, // Sales MTD
            { wch: 15 }, // Sales Today
            { wch: 15 }, // Sales Total
            { wch: 15 }, // Paid MTD
            { wch: 15 }, // Paid Today
            { wch: 15 }, // Paid Total
            { wch: 15 }, // Credit Today
            { wch: 15 }, // Credit MTD
            { wch: 15 }  // Credit Total
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
        
        // Generate filename with date
        const date = new Date().toISOString().split('T')[0];
        const filename = `Dairy_Farm_Balance_Sheet_${date}.xlsx`;
        
        // Download the file
        XLSX.writeFile(wb, filename);
        
        console.log('Excel file exported successfully!');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Error exporting to Excel. Please try again.');
    }
}

// PDF Export using jsPDF and html2canvas
function handlePDF() {
    try {
        const { jsPDF } = window.jspdf;
        
        // Hide buttons temporarily
        const actionButtons = document.querySelector('.action-buttons');
        const searchBar = document.querySelector('.search-bar');
        const deleteButtons = document.querySelectorAll('.btn-delete');
        const addButton = document.querySelector('.btn-add');
        
        actionButtons.style.display = 'none';
        searchBar.style.display = 'none';
        deleteButtons.forEach(btn => btn.style.visibility = 'hidden');
        addButton.style.visibility = 'hidden';
        
        // Get the card element
        const element = document.querySelector('.card');
        
        // Use html2canvas to capture the element
        html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Generate filename with date
            const date = new Date().toISOString().split('T')[0];
            pdf.save(`Dairy_Farm_Balance_Sheet_${date}.pdf`);
            
            // Show buttons again
            actionButtons.style.display = 'flex';
            searchBar.style.display = 'flex';
            deleteButtons.forEach(btn => btn.style.visibility = 'visible');
            addButton.style.visibility = 'visible';
            
            console.log('PDF exported successfully!');
        }).catch(error => {
            console.error('Error generating PDF:', error);
            actionButtons.style.display = 'flex';
            searchBar.style.display = 'flex';
            deleteButtons.forEach(btn => btn.style.visibility = 'visible');
            addButton.style.visibility = 'visible';
            alert('Error generating PDF. Please try again.');
        });
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
    }
}

// Print function
function handlePrint() {
    window.print();
}

// Initialize the table on page load
document.addEventListener('DOMContentLoaded', function() {
    renderTable();
});