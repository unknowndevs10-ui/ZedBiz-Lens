import unittest

from calculations import calculate_financial_summary, load_tax_rules


class FinancialSummaryTests(unittest.TestCase):
    def setUp(self):
        self.rules = load_tax_rules()
        self.sample = {
            "revenue": 42000,
            "cost_of_goods_sold": 27300,
            "operating_expenses": 6500,
            "turnover": 42000,
            "period": "monthly",
            "fixed_costs": 6500,
            "variable_costs": 27300,
            "rules": self.rules,
        }

    def test_profit_and_break_even_example(self):
        result = calculate_financial_summary(**self.sample)
        summary = result["financial_summary"]
        self.assertEqual(summary["gross_profit"], 14700.00)
        self.assertEqual(summary["net_profit_before_tax"], 8200.00)
        self.assertEqual(summary["break_even"]["revenue"], 18571.43)

    def test_turnover_tax_shows_both_unresolved_modes(self):
        result = calculate_financial_summary(**self.sample)
        options = result["tax_demo"]["turnover_tax"]["options"]
        self.assertEqual(options["excess_only"]["estimated_tax"], 1975.00)
        self.assertEqual(options["total_turnover"]["estimated_tax"], 2100.00)
        self.assertIsNone(result["tax_demo"]["turnover_tax"]["selected_mode"])

    def test_monthly_turnover_is_annualised_for_ceiling_and_vat(self):
        result = calculate_financial_summary(**{**self.sample, "turnover": 42000})
        tax = result["tax_demo"]
        self.assertEqual(tax["turnover_tax"]["annual_equivalent_turnover"], 504000.00)
        self.assertEqual(tax["vat_threshold_progress"]["progress_percent"], 63.00)

    def test_above_ceiling_monthly_turnover_is_not_classed_as_turnover_tax(self):
        result = calculate_financial_summary(**{**self.sample, "turnover": 500000})
        options = result["tax_demo"]["turnover_tax"]["options"]
        self.assertEqual(options["excess_only"]["status"], "above_turnover_tax_ceiling")
        self.assertIsNone(options["excess_only"]["estimated_tax"])

    def test_break_even_is_not_invented_without_cost_split(self):
        data = {**self.sample, "fixed_costs": None, "variable_costs": None}
        result = calculate_financial_summary(**data)
        self.assertEqual(result["financial_summary"]["break_even"]["status"], "not_calculated")


if __name__ == "__main__":

    unittest.main()
