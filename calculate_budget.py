import json

# Read entities.json
with open('data/entities.json', 'r', encoding='utf-8') as f:
    entities = json.load(f)

# Sum all budgets
total_budget = 0
for entity in entities:
    budget = entity.get('budget')
    if budget is not None and isinstance(budget, (int, float)):
        total_budget += budget

print(f"Total budget: ${total_budget:,.0f}")
print(f"Total budget in billions: ${total_budget / 1_000_000_000:.2f}B")

# Main Estimates total is $449,177,002,277
main_estimates = 449_177_002_277
print(f"\nMain Estimates total: ${main_estimates:,.0f}")
print(f"Main Estimates in billions: ${main_estimates / 1_000_000_000:.2f}B")
print(f"\nDifference: ${total_budget - main_estimates:,.0f}")
print(f"Difference in billions: ${(total_budget - main_estimates) / 1_000_000_000:.2f}B")
