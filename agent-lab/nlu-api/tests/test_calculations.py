import unittest

from calculations import calculate_financial_summary, load_tax_rules
from ai_rules import parse_batch_text, revenue_baseline


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


class EmergingCoreTests(unittest.TestCase):
    def test_batch_parser_returns_separate_unconfirmed_mixed_phrase_drafts(self):
        result = parse_batch_text("Nagulisa 5 crates ya tomato pa K600, transport K50")
        self.assertEqual(result["kind"], "drafts")
        self.assertTrue(result["needs_owner_confirmation"])
        self.assertEqual([row["draft"]["amount"] for row in result["drafts"]], [600, 50])
        self.assertEqual(result["drafts"][0]["draft"]["quantity"], 5)
        self.assertEqual(result["drafts"][0]["draft"]["itemName"], "tomato")

    def test_tax_question_is_not_answered_by_batch_parser(self):
        result = parse_batch_text("How much VAT do I owe on K500?")
        self.assertEqual(result["kind"], "clarify")
        self.assertEqual(result["drafts"], [])

    def test_forecast_api_is_honest_baseline_and_uses_calendar_span(self):
        result = revenue_baseline([
            {"date": "2026-01-01", "revenue": 100},
            {"date": "2026-01-03", "revenue": 300},
        ], horizon_days=30)
        self.assertEqual(result["predicted_revenue"], 4000)
        self.assertEqual(result["source"], "synthetic-baseline")
        self.assertIn("No XGBoost model is connected", result["notice"])


if __name__ == "__main__":

    unittest.main()

