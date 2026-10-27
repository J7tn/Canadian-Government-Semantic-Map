import csv

# Read the Main Estimates CSV and extract organization budgets
budgets = {}

with open('budgetary-expenditures-standard-object.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        org_name = row.get('Organization', '').strip()
        budget_str = row.get('Total', '0').replace(',', '').replace('$', '').strip()
        
        if org_name and budget_str:
            try:
                budget = float(budget_str)
                if org_name in budgets:
                    budgets[org_name] += budget
                else:
                    budgets[org_name] = budget
            except ValueError:
                pass

# Print all organization budgets
print(f"Total organizations: {len(budgets)}")
print("\nOrganization budgets:")
for org in sorted(budgets.keys()):
    print(f"  {org}: ${budgets[org]:,.2f}")

# Calculate total
total = sum(budgets.values())
print(f"\nTotal: ${total:,.2f}")
