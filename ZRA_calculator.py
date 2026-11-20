# Simple ZRA Tax Calculator

# 1. Enter your monthly numbers here
revenue = 42000.0
cogs = 27300.0
expenses = 6500.0

# 2. Basic Profit Calculations
gross_profit = revenue - cogs
net_profit = gross_profit - expenses

# 3. Turnover Tax (Using the K2,500 monthly nil band and 5% rate)
taxable_amount = revenue - 2500
turnover_tax_excess = taxable_amount * 0.05
turnover_tax_total = revenue * 0.05

# 4. VAT Progress (Monthly revenue annualized against K800,000 threshold)
annual_turnover = revenue * 12
vat_progress_pct = (annual_turnover / 800000) * 100

# 5. Print the results clearly
print("=== RESULTS ===")
print(f"Gross Profit: K{gross_profit:,.2f}")
print(f"Net Profit: K{net_profit:,.2f}")
print(f"Turnover Tax (Excess Only): K{turnover_tax_excess:,.2f}")
print(f"Turnover Tax (Total): K{turnover_tax_total:,.2f}")
print(f"VAT Progress: {vat_progress_pct}%")
