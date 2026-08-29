from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'dairy_flow'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'postgres'),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# ==================== PRODUCTION ENDPOINTS ====================

@app.route('/api/production', methods=['GET'])
def get_production():
    """Get all production records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Get optional filters
        year = request.args.get('year')
        month = request.args.get('month')
        date = request.args.get('date')
        buffalo_name = request.args.get('buffalo_name')
        
        query = "SELECT * FROM production WHERE 1=1"
        params = []
        
        if year:
            query += " AND EXTRACT(YEAR FROM date) = %s"
            params.append(int(year))
        if month:
            query += " AND EXTRACT(MONTH FROM date) = %s"
            params.append(int(month))
        if date:
            query += " AND EXTRACT(DAY FROM date) = %s"
            params.append(int(date))
        if buffalo_name:
            query += " AND buffalo_name ILIKE %s"
            params.append(f'%{buffalo_name}%')
        
        query += " ORDER BY date DESC, buffalo_name ASC"
        
        cur.execute(query, params)
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/production', methods=['POST'])
def save_production():
    """Save production data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        cur = conn.cursor()
        
        # Handle single record or array
        records = data if isinstance(data, list) else [data]
        
        for record in records:
            # Extract buffalo number from name if it's like "Buffalo 1"
            buffalo_number = None
            buffalo_name = record.get('buffaloName') or record.get('buffalo_name', '')
            if buffalo_name:
                import re
                match = re.search(r'\d+', buffalo_name)
                if match:
                    buffalo_number = int(match.group())
            
            cur.execute("""
                INSERT INTO production (buffalo_name, buffalo_number, am_liters, pm_liters, date)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                buffalo_name,
                buffalo_number,
                record.get('am') or record.get('amLiters', 0),
                record.get('pm') or record.get('pmLiters', 0),
                record.get('date', datetime.now().date())
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Production data saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/production/<int:production_id>', methods=['PUT', 'DELETE'])
def update_or_delete_production(production_id):
    """Update or delete a production record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            # Extract buffalo number from name if provided
            buffalo_number = None
            buffalo_name = data.get('buffaloName') or data.get('buffalo_name', '')
            if buffalo_name:
                import re
                match = re.search(r'\d+', buffalo_name)
                if match:
                    buffalo_number = int(match.group())
            
            cur.execute("""
                UPDATE production 
                SET buffalo_name = %s, buffalo_number = %s, am_liters = %s, pm_liters = %s, date = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                buffalo_name,
                buffalo_number,
                data.get('am') or data.get('amLiters', 0),
                data.get('pm') or data.get('pmLiters', 0),
                data.get('date'),
                production_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Production record updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM production WHERE id = %s", (production_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Production record deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== SALES ENDPOINTS ====================

@app.route('/api/sales', methods=['GET'])
def get_sales():
    """Get all sales records with optional filters"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get optional filters
        year = request.args.get('year')
        month = request.args.get('month')
        date = request.args.get('date')
        table_type = request.args.get('table_type')
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM sales WHERE 1=1"
        params = []
        
        if year:
            query += " AND EXTRACT(YEAR FROM date) = %s"
            params.append(int(year))
        if month:
            query += " AND EXTRACT(MONTH FROM date) = %s"
            params.append(int(month))
        if date:
            query += " AND EXTRACT(DAY FROM date) = %s"
            params.append(int(date))
        if table_type:
            query += " AND table_type = %s"
            params.append(table_type)
        
        query += " ORDER BY date DESC, id ASC"
        
        cur.execute(query, params)
        records = cur.fetchall()
        
        # Convert to frontend format
        result = []
        for record in records:
            result.append({
                'id': record['id'],
                'customerName': record['customer_name'],
                'litersPurchased': float(record['liters_purchased']),
                'rpl': float(record['rpl']),
                'quantity': float(record['quantity']),
                'amountDue': float(record['amount_due']),
                'amountPaid': float(record['amount_paid']),
                'tableType': record['table_type'],
                'date': str(record['date'])
            })
        
        cur.close()
        conn.close()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sales', methods=['POST'])
def save_sales():
    """Save sales data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO sales (customer_name, liters_purchased, rpl, quantity, amount_paid, table_type, date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data.get('customerName'),
            data.get('litersPurchased'),
            data.get('rpl'),
            data.get('quantity'),
            data.get('amountPaid', 0),
            data.get('tableType', 'AM'),
            data.get('date', datetime.now().date())
        ))
        
        record_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Sales data saved successfully', 'id': record_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sales/<int:sale_id>', methods=['PUT', 'DELETE'])
def update_or_delete_sale(sale_id):
    """Update or delete a sales record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            cur.execute("""
                UPDATE sales 
                SET customer_name = %s, liters_purchased = %s, rpl = %s, quantity = %s, 
                    amount_paid = %s, table_type = %s, date = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('customerName'),
                data.get('litersPurchased'),
                data.get('rpl'),
                data.get('quantity'),
                data.get('amountPaid', 0),
                data.get('tableType', 'AM'),
                data.get('date'),
                sale_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Sales record updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM sales WHERE id = %s", (sale_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Sales record deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PURCHASES ENDPOINTS ====================

@app.route('/api/purchases', methods=['GET'])
def get_purchases():
    """Get all purchase records with optional filters"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get optional filters
        date_filter = request.args.get('date')
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if date_filter:
            cur.execute("SELECT * FROM purchases WHERE date = %s ORDER BY id ASC", (date_filter,))
        else:
            cur.execute("SELECT * FROM purchases ORDER BY date DESC, id ASC")
        
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/purchases', methods=['POST'])
def save_purchases():
    """Save purchase data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        cur = conn.cursor()
        
        # Handle single record or array
        records = data if isinstance(data, list) else [data]
        saved_ids = []
        
        for record in records:
            cur.execute("""
                INSERT INTO purchases (item_type, quantity, price_per_unit, mtd, date)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                record.get('itemType', 'khalli'),
                record.get('quantity', 0),
                record.get('pricePerUnit', 0),
                record.get('mtd', 0),
                record.get('date', datetime.now().date())
            ))
            saved_ids.append(cur.fetchone()[0])
        
        conn.commit()
        cur.close()
        conn.close()
        
        if len(saved_ids) == 1:
            return jsonify({'message': 'Purchase data saved successfully', 'id': saved_ids[0]}), 201
        else:
            return jsonify({'message': 'Purchase data saved successfully', 'ids': saved_ids}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/purchases/<int:purchase_id>', methods=['PUT', 'DELETE'])
def update_or_delete_purchase(purchase_id):
    """Update or delete a purchase record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            cur.execute("""
                UPDATE purchases 
                SET item_type = %s, quantity = %s, price_per_unit = %s, mtd = %s, date = %s
                WHERE id = %s
            """, (
                data.get('itemType'),
                data.get('quantity'),
                data.get('pricePerUnit'),
                data.get('mtd'),
                data.get('date'),
                purchase_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Purchase record updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM purchases WHERE id = %s", (purchase_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Purchase record deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== EXPENSES ENDPOINTS ====================

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expense records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM expenses ORDER BY date DESC, id ASC")
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
def save_expenses():
    """Save expense data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO expenses (category, description, amount, date)
            VALUES (%s, %s, %s, %s)
        """, (
            data.get('category'),
            data.get('description'),
            data.get('amount'),
            datetime.now().date()
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Expense data saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['PUT', 'DELETE'])
def update_or_delete_expense(expense_id):
    """Update or delete an expense record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            cur.execute("""
                UPDATE expenses 
                SET category = %s, description = %s, amount = %s, date = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('category'),
                data.get('description'),
                data.get('amount'),
                data.get('date'),
                expense_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Expense updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Expense deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== SALARIES ENDPOINTS ====================

@app.route('/api/salaries', methods=['GET'])
def get_salaries():
    """Get all salary records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM salaries ORDER BY employee_name ASC")
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/salaries', methods=['POST'])
def save_salaries():
    """Save salary data (bulk update)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        employees = data.get('employees', [])
        cur = conn.cursor()
        
        for employee in employees:
            # Check if employee exists
            cur.execute("SELECT id FROM salaries WHERE employee_name = %s", (employee['name'],))
            existing = cur.fetchone()
            
            if existing:
                # Update existing
                cur.execute("""
                    UPDATE salaries 
                    SET total_amount = %s, paid_amount = %s, balance = %s
                    WHERE employee_name = %s
                """, (
                    employee['amount'],
                    employee['paid'],
                    employee['amount'] - employee['paid'],
                    employee['name']
                ))
            else:
                # Insert new
                cur.execute("""
                    INSERT INTO salaries (employee_name, total_amount, paid_amount, balance)
                    VALUES (%s, %s, %s, %s)
                """, (
                    employee['name'],
                    employee['amount'],
                    employee['paid'],
                    employee['amount'] - employee['paid']
                ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Salaries saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/salaries/<int:salary_id>', methods=['PUT', 'DELETE'])
def update_or_delete_salary(salary_id):
    """Update or delete a salary record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json

            
            total = float(data.get('totalAmount', 0))
            paid = float(data.get('paidAmount', 0))

            
            balance = total - paid

            
            cur.execute("""
                UPDATE salaries 
                SET employee_name = %s, 
                    total_amount = %s, 
                    paid_amount = %s,
                    balance = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('employeeName'),
                total,
                paid,
                balance,
                salary_id
            ))

            conn.commit()
            cur.close()
            conn.close()

            return jsonify({
                'message': 'Salary updated successfully',
                'balance': balance
            }), 200

        else:  # DELETE
            cur.execute("DELETE FROM salaries WHERE id = %s", (salary_id,))
            conn.commit()
            cur.close()
            conn.close()

            return jsonify({'message': 'Salary record deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BALANCE SHEET ENDPOINTS ====================

@app.route('/api/balance-sheet', methods=['GET'])
def get_balance_sheet():
    """Get all balance sheet records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM balance_sheet ORDER BY customer_name ASC")
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet', methods=['POST'])
def save_balance_sheet():
    """Save balance sheet data (bulk update)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        customers = data.get('customers', [])
        cur = conn.cursor()
        
        for customer in customers:
            # Check if customer exists
            cur.execute("SELECT id FROM balance_sheet WHERE customer_name = %s", (customer['customerName'],))
            existing = cur.fetchone()
            
            if existing:
                # Update existing
                cur.execute("""
                    UPDATE balance_sheet 
                    SET litres_mtd = %s, litres_today = %s, litres_total = %s,
                        sales_mtd = %s, sales_today = %s, sales_total = %s,
                        cash_mtd = %s, cash_today = %s, cash_total = %s,
                        credit_today = %s, credit_mtd = %s, credit_total = %s
                    WHERE customer_name = %s
                """, (
                    customer['litres']['mtd'],
                    customer['litres']['today'],
                    customer['litres']['mtd'] + customer['litres']['today'],
                    customer['sales']['mtd'],
                    customer['sales']['today'],
                    customer['sales']['mtd'] + customer['sales']['today'],
                    customer['paidCash']['mtd'],
                    customer['paidCash']['today'],
                    customer['paidCash']['mtd'] + customer['paidCash']['today'],
                    customer['credit']['today'],
                    customer['credit']['mtd'],
                    customer['credit']['today'] + customer['credit']['mtd'],
                    customer['customerName']
                ))
            else:
                # Insert new
                cur.execute("""
                    INSERT INTO balance_sheet 
                    (customer_name, litres_mtd, litres_today, litres_total,
                     sales_mtd, sales_today, sales_total,
                     cash_mtd, cash_today, cash_total,
                     credit_today, credit_mtd, credit_total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    customer['customerName'],
                    customer['litres']['mtd'],
                    customer['litres']['today'],
                    customer['litres']['mtd'] + customer['litres']['today'],
                    customer['sales']['mtd'],
                    customer['sales']['today'],
                    customer['sales']['mtd'] + customer['sales']['today'],
                    customer['paidCash']['mtd'],
                    customer['paidCash']['today'],
                    customer['paidCash']['mtd'] + customer['paidCash']['today'],
                    customer['credit']['today'],
                    customer['credit']['mtd'],
                    customer['credit']['today'] + customer['credit']['mtd']
                ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Balance sheet data saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet/<int:customer_id>', methods=['PUT', 'DELETE'])
def update_or_delete_balance_sheet(customer_id):
    """Update or delete a balance sheet record"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor()
        
        if request.method == 'PUT':
            data = request.json
            cur.execute("""
                UPDATE balance_sheet 
                SET customer_name = %s, litres_mtd = %s, litres_today = %s,
                    sales_mtd = %s, sales_today = %s,
                    cash_mtd = %s, cash_today = %s,
                    credit_today = %s, credit_mtd = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data.get('customerName'),
                data.get('litresMTD'),
                data.get('litresToday'),
                data.get('salesMTD'),
                data.get('salesToday'),
                data.get('paidMTD'),
                data.get('paidToday'),
                data.get('creditToday'),
                data.get('creditMTD'),
                customer_id
            ))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Balance sheet record updated successfully'}), 200
        else:  # DELETE
            cur.execute("DELETE FROM balance_sheet WHERE id = %s", (customer_id,))
            conn.commit()
            cur.close()
            conn.close()
            return jsonify({'message': 'Balance sheet record deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== BALANCE SHEET HISTORY ENDPOINTS ====================

@app.route('/api/balance-sheet-history', methods=['GET'])
def get_balance_sheet_history():
    """Get balance sheet history records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get optional filters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        customer_name = request.args.get('customer_name')
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM balance_sheet_history WHERE 1=1"
        params = []
        
        if date_from:
            query += " AND date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND date <= %s"
            params.append(date_to)
        if customer_name:
            query += " AND customer_name = %s"
            params.append(customer_name)
        
        query += " ORDER BY date DESC, customer_name ASC"
        
        cur.execute(query, params)
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet-history', methods=['POST'])
def save_balance_sheet_history():
    """Save balance sheet history data for a specific date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        history_date = data.get('date', datetime.now().date())
        customers = data.get('customers', [])
        cur = conn.cursor()
        
        for customer in customers:
            # Insert or update history record
            cur.execute("""
                INSERT INTO balance_sheet_history 
                (customer_name, date, litres_mtd, litres_today, litres_total,
                 sales_mtd, sales_today, sales_total,
                 cash_mtd, cash_today, cash_total,
                 credit_today, credit_mtd, credit_total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (customer_name, date) DO UPDATE SET
                    litres_mtd = EXCLUDED.litres_mtd,
                    litres_today = EXCLUDED.litres_today,
                    sales_mtd = EXCLUDED.sales_mtd,
                    sales_today = EXCLUDED.sales_today,
                    cash_mtd = EXCLUDED.cash_mtd,
                    cash_today = EXCLUDED.cash_today,
                    credit_today = EXCLUDED.credit_today,
                    credit_mtd = EXCLUDED.credit_mtd,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                customer['customerName'],
                history_date,
                customer['litres']['mtd'],
                customer['litres']['today'],
                customer['litres']['mtd'] + customer['litres']['today'],
                customer['sales']['mtd'],
                customer['sales']['today'],
                customer['sales']['mtd'] + customer['sales']['today'],
                customer['paidCash']['mtd'],
                customer['paidCash']['today'],
                customer['paidCash']['mtd'] + customer['paidCash']['today'],
                customer['credit']['today'],
                customer['credit']['mtd'],
                customer['credit']['today'] + customer['credit']['mtd']
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Balance sheet history saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/balance-sheet-history/save-today', methods=['POST'])
def save_today_balance_sheet_history():
    """Automatically save today's balance sheet data to history"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        today = datetime.now().date()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all current balance sheet records
        cur.execute("SELECT * FROM balance_sheet")
        current_records = cur.fetchall()
        
        # Save each to history
        saved_count = 0
        for record in current_records:
            cur.execute("""
                INSERT INTO balance_sheet_history 
                (customer_name, date, litres_mtd, litres_today, litres_total,
                 sales_mtd, sales_today, sales_total,
                 cash_mtd, cash_today, cash_total,
                 credit_today, credit_mtd, credit_total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (customer_name, date) DO UPDATE SET
                    litres_mtd = EXCLUDED.litres_mtd,
                    litres_today = EXCLUDED.litres_today,
                    sales_mtd = EXCLUDED.sales_mtd,
                    sales_today = EXCLUDED.sales_today,
                    cash_mtd = EXCLUDED.cash_mtd,
                    cash_today = EXCLUDED.cash_today,
                    credit_today = EXCLUDED.credit_today,
                    credit_mtd = EXCLUDED.credit_mtd,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                record['customer_name'],
                today,
                record['litres_mtd'],
                record['litres_today'],
                record['litres_total'],
                record['sales_mtd'],
                record['sales_today'],
                record['sales_total'],
                record['cash_mtd'],
                record['cash_today'],
                record['cash_total'],
                record['credit_today'],
                record['credit_mtd'],
                record['credit_total']
            ))
            saved_count += 1
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({
            'message': f'Balance sheet history saved successfully for {saved_count} customers',
            'date': str(today),
            'count': saved_count
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== SUMMARIES ENDPOINTS ====================

@app.route('/api/summaries', methods=['GET'])
def get_summaries():
    """Get all summary records"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get date range parameter (optional)
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if date_from and date_to:
            cur.execute("""
                SELECT * FROM summaries 
                WHERE date BETWEEN %s AND %s
                ORDER BY date DESC
            """, (date_from, date_to))
        else:
            cur.execute("SELECT * FROM summaries ORDER BY date DESC")
        
        records = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(record) for record in records]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summaries/<date>', methods=['GET'])
def get_summary_by_date(date):
    """Get summary for a specific date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM summaries WHERE date = %s", (date,))
        record = cur.fetchone()
        cur.close()
        conn.close()
        
        if record:
            return jsonify(dict(record)), 200
        else:
            return jsonify({'error': 'Summary not found for the specified date'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summaries', methods=['POST'])
def save_summary():
    """Save or update summary data for a specific date"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        summary_date = data.get('date', datetime.now().date())
        cur = conn.cursor()
        
        # Check if summary exists for this date
        cur.execute("SELECT id FROM summaries WHERE date = %s", (summary_date,))
        existing = cur.fetchone()
        
        if existing:
            # Update existing
            cur.execute("""
                UPDATE summaries 
                SET total_sales = %s, total_expenses = %s, 
                    total_purchases = %s, total_salaries = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE date = %s
            """, (
                data.get('totalSales', 0),
                data.get('totalExpenses', 0),
                data.get('totalPurchases', 0),
                data.get('totalSalaries', 0),
                summary_date
            ))
        else:
            # Insert new
            cur.execute("""
                INSERT INTO summaries (date, total_sales, total_expenses, total_purchases, total_salaries)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                summary_date,
                data.get('totalSales', 0),
                data.get('totalExpenses', 0),
                data.get('totalPurchases', 0),
                data.get('totalSalaries', 0)
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Summary saved successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summaries/calculate', methods=['POST'])
def calculate_summary():
    """Calculate summary for a specific date from all related tables"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        summary_date = data.get('date', datetime.now().date())
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Calculate totals from all tables for the date
        # Total Sales
        cur.execute("""
            SELECT COALESCE(SUM(liters_purchased * rpl), 0) as total 
            FROM sales WHERE date = %s
        """, (summary_date,))
        total_sales = cur.fetchone()['total']
        
        # Total Expenses
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM expenses WHERE date = %s
        """, (summary_date,))
        total_expenses = cur.fetchone()['total']
        
        # Total Purchases
        cur.execute("""
            SELECT COALESCE(SUM(quantity * price_per_unit), 0) as total 
            FROM purchases WHERE date = %s
        """, (summary_date,))
        total_purchases = cur.fetchone()['total']
        
        # Total Salaries (for the date, if salaries are date-based)
        # Note: Current schema doesn't have date for salaries, so we'll use current month total
        cur.execute("""
            SELECT COALESCE(SUM(total_amount), 0) as total 
            FROM salaries
        """)
        total_salaries = cur.fetchone()['total']
        
        # Calculate net profit
        net_profit = float(total_sales) - float(total_expenses) - float(total_purchases) - float(total_salaries)
        
        # Save to summaries table
        cur.execute("""
            INSERT INTO summaries (date, total_sales, total_expenses, total_purchases, total_salaries)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (date) DO UPDATE SET
                total_sales = EXCLUDED.total_sales,
                total_expenses = EXCLUDED.total_expenses,
                total_purchases = EXCLUDED.total_purchases,
                total_salaries = EXCLUDED.total_salaries,
                updated_at = CURRENT_TIMESTAMP
        """, (summary_date, total_sales, total_expenses, total_purchases, total_salaries))
        
        conn.commit()
        
        # Fetch the saved summary
        cur.execute("SELECT * FROM summaries WHERE date = %s", (summary_date,))
        summary = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return jsonify(dict(summary)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== DATA RETENTION ALERTS ENDPOINTS ====================

@app.route('/api/alerts/retention', methods=['GET'])
def get_retention_alerts():
    """Get all active data retention alerts"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # First, update alerts by checking current data
        cur.execute("SELECT update_data_retention_alerts()")
        conn.commit()
        
        # Get active alerts
        cur.execute("""
            SELECT * FROM data_retention_alerts 
            WHERE alert_status = 'active'
            ORDER BY oldest_date ASC, created_at DESC
        """)
        alerts = cur.fetchall()
        
        cur.close()
        conn.close()
        return jsonify([dict(alert) for alert in alerts]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/retention/check', methods=['POST'])
def check_retention():
    """Manually trigger data retention check"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Run retention check
        cur.execute("SELECT * FROM check_data_retention()")
        results = cur.fetchall()
        
        # Update alerts table
        cur.execute("SELECT update_data_retention_alerts()")
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'alerts': [dict(result) for result in results],
            'message': 'Retention check completed'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/retention/<int:alert_id>', methods=['PUT'])
def update_alert_status(alert_id):
    """Update alert status (dismiss or resolve)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.json
        new_status = data.get('status', 'dismissed')
        
        if new_status not in ['active', 'dismissed', 'resolved']:
            return jsonify({'error': 'Invalid status'}), 400
        
        cur = conn.cursor()
        cur.execute("""
            UPDATE data_retention_alerts 
            SET alert_status = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (new_status, alert_id))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Alert status updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/retention/stats', methods=['GET'])
def get_retention_stats():
    """Get statistics about data retention across all tables"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        retention_limit = datetime.now().date() - timedelta(days=1825)  # 5 years
        
        stats = {}
        tables = ['production', 'sales', 'purchases', 'expenses', 'summaries', 'balance_sheet_history']
        
        for table in tables:
            cur.execute(f"""
                SELECT 
                    MIN(date) as oldest_date,
                    MAX(date) as newest_date,
                    COUNT(*) as total_records,
                    COUNT(*) FILTER (WHERE date < %s) as records_beyond_limit
                FROM {table}
            """, (retention_limit,))
            result = cur.fetchone()
            stats[table] = dict(result)
        
        cur.close()
        conn.close()
        return jsonify({
            'retention_limit_date': str(retention_limit),
            'retention_limit_years': 5,
            'tables': stats
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({'status': 'healthy', 'database': 'connected'}), 200
    else:
        return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)

