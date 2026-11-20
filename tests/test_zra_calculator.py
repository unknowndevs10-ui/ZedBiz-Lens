import unittest

from Trial_ZRA_Calculator import calculate_example


class SharedZraCalculatorTests(unittest.TestCase):
    def test_worked_example_matches_the_shared_engine(self):
        result = calculate_example()
        financial = result["financial_summary"]
        self.assertEqual(financial["gross_profit"], 14700.00)
        self.assertEqual(financial["net_profit_before_tax"], 8200.00)
        self.assertEqual(financial["break_even"]["revenue"], 18571.43)
        options = result["tax_demo"]["turnover_tax"]["options"]
        self.assertEqual(options["excess_only"]["estimated_tax"], 1975.00)
        self.assertEqual(options["total_turnover"]["estimated_tax"], 2100.00)

    def test_monthly_ceiling_uses_annual_equivalent(self):
        result = calculate_example(turnover=500000)
        options = result["tax_demo"]["turnover_tax"]["options"]
        self.assertEqual(options["excess_only"]["status"], "above_turnover_tax_ceiling")
        self.assertIsNone(options["excess_only"]["estimated_tax"])

    def test_tax_method_and_vat_payable_are_not_auto_selected(self):
        tax = calculate_example()["tax_demo"]
        self.assertIsNone(tax["turnover_tax"]["selected_mode"])
        self.assertIsNone(tax["vat_threshold_progress"]["vat_payable"])

    def test_missing_cost_split_does_not_invent_break_even(self):
        result = calculate_example(fixed_costs=None, variable_costs=None)
        self.assertEqual(result["financial_summary"]["break_even"]["status"], "not_calculated")


if __name__ == "__main__":
    unittest.main()
