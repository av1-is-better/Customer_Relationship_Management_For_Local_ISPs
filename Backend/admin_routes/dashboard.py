from sqlalchemy import text
from fastapi import HTTPException

# (/dashboard)
async def dashboard(user_email, db):
    try:
        # Parameterized query using :email as a placeholder
        query = text("""WITH tariff_plan_data AS (
    SELECT 
        tariff_plans.plan_id,
        tariff_plans.plan_name,
        tariff_plans.plan_speed,
        tariff_plans.speed_unit,
        tariff_plans.plan_validity,
        tariff_plans.validity_unit,
        tariff_plans.plan_cost, 
        COALESCE(COUNT(users.email), 0) AS subscribers
    FROM tariff_plans
    LEFT JOIN users ON tariff_plans.plan_id = users.plan_id
    GROUP BY tariff_plans.plan_id
    ORDER BY tariff_plans.plan_id
    LIMIT 3
),
user_summary AS (
    SELECT 
        COALESCE(COUNT(DISTINCT users.email), 0) AS client_count
    FROM users
),
transaction_summary AS (
    SELECT 
        COALESCE(COUNT(transactions.invoice), 0) AS transaction_count, 
        COALESCE(SUM(transactions.amount), 0) AS amount_total
    FROM transactions
),
transaction_mode AS (
    SELECT
        COALESCE(SUM(CASE WHEN mode = 'CASH' THEN 1 ELSE 0 END), 0) AS cash_transaction_count,
        COALESCE(SUM(CASE WHEN mode = 'UPI' THEN 1 ELSE 0 END), 0) AS upi_transaction_count,
        COALESCE(SUM(CASE WHEN mode = 'CREDIT CARD' THEN 1 ELSE 0 END), 0) AS credit_card_transaction_count,
        COALESCE(SUM(CASE WHEN mode = 'DEBIT CARD' THEN 1 ELSE 0 END), 0) AS debit_card_transaction_count,
        COALESCE(SUM(CASE WHEN mode = 'NETBANKING' THEN 1 ELSE 0 END), 0) AS netbanking_transaction_count,
        COALESCE(SUM(CASE WHEN mode = 'CHEQUE' THEN 1 ELSE 0 END), 0) AS cheque_transaction_count,
        COALESCE(SUM(CASE WHEN mode = 'CASH' THEN amount ELSE 0 END), 0) AS amount_received_via_cash,
        COALESCE(SUM(CASE WHEN mode = 'UPI' THEN amount ELSE 0 END), 0) AS amount_received_via_upi,
        COALESCE(SUM(CASE WHEN mode = 'CREDIT CARD' THEN amount ELSE 0 END), 0) AS amount_received_via_credit_card,
        COALESCE(SUM(CASE WHEN mode = 'DEBIT CARD' THEN amount ELSE 0 END), 0) AS amount_received_via_debit_card,
        COALESCE(SUM(CASE WHEN mode = 'NETBANKING' THEN amount ELSE 0 END), 0) AS amount_received_via_netbanking,
        COALESCE(SUM(CASE WHEN mode = 'CHEQUE' THEN amount ELSE 0 END), 0) AS amount_received_via_cheque
    FROM transactions
),
issue_summary_data AS (
    SELECT
        COALESCE(SUM(CASE WHEN issue_status = 'true' THEN 1 ELSE 0 END), 0) AS active_issues_count,
        COALESCE(SUM(CASE WHEN issue_status = 'false' THEN 1 ELSE 0 END), 0) AS resolved_issues_count,
        COALESCE(COUNT(issue_no), 0) AS total_issues_count
    FROM issues
),
tariff_count AS (
    SELECT
        COALESCE(COUNT(tariff_plans.plan_id), 0) AS total_plans
    FROM tariff_plans
),
review_data AS (
    SELECT
        COALESCE(COUNT(review_no), 0) AS total_reviews
    FROM reviews
)
SELECT 
    tpd.*, 
    tc.*,
    us.*,
    ts.*, 
    tm.*,
    isd.*,
    rd.*
FROM 
    (SELECT * FROM tariff_plan_data LIMIT 3) tpd
FULL OUTER JOIN tariff_count tc ON true
FULL OUTER JOIN user_summary us ON true
FULL OUTER JOIN transaction_summary ts ON true
FULL OUTER JOIN transaction_mode tm ON true
FULL OUTER JOIN issue_summary_data isd ON true
FULL OUTER JOIN review_data rd ON true;
""")
        result = await db.execute(query)
        rows = result.fetchall()
        # result contains data
        if rows:
            dashboard_result_with_columns = [dict(row._mapping) for row in rows]
            
            recent_transactions_query = text("""
            WITH transaction_data AS (
                SELECT 
                    users.name, 
                    users.phone, 
                    users.email, 
                    transactions.invoice, 
                    transactions.id, 
                    transactions.date, 
                    transactions.mode, 
                    transactions.amount,
                    transactions.auto_generated,
                    transactions.transaction_timestamp
                FROM users
                JOIN transactions ON users.email = transactions.email
                ORDER BY transactions.transaction_timestamp DESC
                OFFSET 0
                LIMIT 50
            ),
            transaction_summary AS (
                SELECT 
                    COUNT(transactions.invoice) AS transaction_count
                FROM transactions)
            SELECT 
                td.*, 
                ts.*
            FROM 
                transaction_data td,
                transaction_summary ts""")
            
            recent_transactions_result = await db.execute(recent_transactions_query)
            recent_transactions_rows = recent_transactions_result.fetchall()
            
            # Recent Transactions Found
            if recent_transactions_rows:
                transaction_data = [dict(row._mapping) for row in recent_transactions_rows]
                return {
                    "result": True,
                    "data":dashboard_result_with_columns,
                    "transaction_data": transaction_data
                    }
            # No Recent Transactions Found
            else:
                return {
                    "result": True,
                    "data":dashboard_result_with_columns
                    }
        
        # result is empty
        else:
            return {"result": False}
    except Exception as e:
        await db.rollback()  # Rollback the transaction on error
        raise HTTPException(status_code=400, detail=str(e))